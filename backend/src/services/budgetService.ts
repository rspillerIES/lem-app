import { query } from '../config/database';
import { BudgetBreakdown, DashboardMetrics } from '../types';
import { AppError } from '../middleware/errors';

/**
 * Budget Service
 * Handles budget calculations, variance analysis, dashboard metrics
 * Three-tier budget: Budget (allocated) | FIWP Hours (planned) | Actual (from entries)
 */

/**
 * Get budget breakdown by cost code (three-tier view)
 */
export async function getBudgetBreakdown(
  projectId: string
): Promise<{
  cost_codes: BudgetBreakdown[];
  total_budget: number;
  total_actual: number;
  total_remaining: number;
  total_percent_used: number;
}> {
  try {
    // Get all cost codes for project with budgets
    const costCodesResult = await query<{
      project_cost_code_id: string;
      cost_code_id: string;
      description: string;
      cost_type: string;
      execution_phase: string;
      budget_allocated: number;
    }>(
      `SELECT project_cost_code_id, cost_code_id, description, cost_type,
              execution_phase, budget_allocated
       FROM project_cost_codes
       WHERE project_id = $1`,
      [projectId]
    );

    const breakdown: BudgetBreakdown[] = [];
    let totalBudget = 0;
    let totalActual = 0;

    for (const cc of costCodesResult.rows) {
      // Get FIWP planned hours (if exists)
      const fiwpResult = await query<{ planned_hours: number }>(
        `SELECT SUM(planned_hours) as planned_hours FROM fiwp_register
         WHERE project_id = $1 AND cost_code_id = $2`,
        [projectId, cc.cost_code_id]
      );

      const fiwpHours = fiwpResult.rows[0]?.planned_hours || 0;

      // Get actual cost from time entries
      const timeResult = await query<{ total_cost: number; total_hours: number }>(
        `SELECT SUM(total_cost) as total_cost, SUM(regular_hours + overtime_hours + travel_hours) as total_hours
         FROM daily_time_entries
         WHERE project_id = $1 AND cost_code_id = $2`,
        [projectId, cc.cost_code_id]
      );

      // Get actual cost from equipment entries
      const eqResult = await query<{ total_cost: number }>(
        `SELECT SUM(total_cost) as total_cost FROM daily_equipment_entries
         WHERE project_id = $1 AND cost_code_id = $2`,
        [projectId, cc.cost_code_id]
      );

      // Get actual cost from material entries
      const matResult = await query<{ total_cost: number }>(
        `SELECT SUM(amount) as total_cost FROM daily_material_entries
         WHERE project_id = $1 AND cost_code_id = $2`,
        [projectId, cc.cost_code_id]
      );

      const actualTime = timeResult.rows[0]?.total_cost || 0;
      const actualHours = timeResult.rows[0]?.total_hours || 0;
      const actualEquip = eqResult.rows[0]?.total_cost || 0;
      const actualMat = matResult.rows[0]?.total_cost || 0;
      const actualCost = actualTime + actualEquip + actualMat;

      const remainingBudget = cc.budget_allocated - actualCost;
      const percentUsed =
        cc.budget_allocated > 0
          ? Math.round((actualCost / cc.budget_allocated) * 100 * 10) / 10
          : 0;
      const percentOfFIWP =
        fiwpHours > 0
          ? Math.round((actualHours / fiwpHours) * 100 * 10) / 10
          : 0;

      breakdown.push({
        project_cost_code_id: cc.project_cost_code_id,
        cost_code_id: cc.cost_code_id,
        description: cc.description,
        cost_type: cc.cost_type,
        execution_phase: cc.execution_phase,
        budget_allocated: cc.budget_allocated,
        fiwp_hours: fiwpHours,
        actual_hours: actualHours,
        actual_cost: Math.round(actualCost * 100) / 100,
        remaining_budget: Math.round(remainingBudget * 100) / 100,
        percent_used: percentUsed,
        percent_of_fiwp: percentOfFIWP,
      });

      totalBudget += cc.budget_allocated;
      totalActual += actualCost;
    }

    const totalRemaining = totalBudget - totalActual;
    const totalPercentUsed =
      totalBudget > 0
        ? Math.round((totalActual / totalBudget) * 100 * 10) / 10
        : 0;

    return {
      cost_codes: breakdown,
      total_budget: Math.round(totalBudget * 100) / 100,
      total_actual: Math.round(totalActual * 100) / 100,
      total_remaining: Math.round(totalRemaining * 100) / 100,
      total_percent_used: totalPercentUsed,
    };
  } catch (err) {
    console.error('Error calculating budget breakdown:', err);
    throw new AppError('Failed to calculate budget breakdown', 500);
  }
}

/**
 * Get budget for a single client (all projects)
 */
export async function getClientBudget(clientId: string): Promise<{
  client_name: string;
  projects: Array<{
    project_id: string;
    project_name: string;
    budget: number;
    actual: number;
    remaining: number;
    percent_used: number;
  }>;
  total_budget: number;
  total_actual: number;
  total_remaining: number;
  total_percent_used: number;
}> {
  try {
    // Get client name
    const clientResult = await query<{ client_name: string }>(
      'SELECT client_name FROM clients WHERE client_id = $1',
      [clientId]
    );

    if (clientResult.rowCount === 0) {
      throw new AppError('Client not found', 404);
    }

    const clientName = clientResult.rows[0].client_name;

    // Get all projects for client
    const projectsResult = await query<{
      project_id: string;
      project_name: string;
      po_value: number;
    }>(
      `SELECT project_id, project_name, po_value FROM projects WHERE client_id = $1`,
      [clientId]
    );

    const projects = [];
    let totalBudget = 0;
    let totalActual = 0;

    for (const proj of projectsResult.rows) {
      // Get actual costs
      const timeResult = await query<{ total: number }>(
        `SELECT SUM(total_cost) as total FROM daily_time_entries WHERE project_id = $1`,
        [proj.project_id]
      );

      const eqResult = await query<{ total: number }>(
        `SELECT SUM(total_cost) as total FROM daily_equipment_entries WHERE project_id = $1`,
        [proj.project_id]
      );

      const matResult = await query<{ total: number }>(
        `SELECT SUM(amount) as total FROM daily_material_entries WHERE project_id = $1`,
        [proj.project_id]
      );

      const actual =
        (timeResult.rows[0]?.total || 0) +
        (eqResult.rows[0]?.total || 0) +
        (matResult.rows[0]?.total || 0);

      const remaining = proj.po_value - actual;
      const percentUsed =
        proj.po_value > 0
          ? Math.round((actual / proj.po_value) * 100 * 10) / 10
          : 0;

      projects.push({
        project_id: proj.project_id,
        project_name: proj.project_name,
        budget: Math.round(proj.po_value * 100) / 100,
        actual: Math.round(actual * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percent_used: percentUsed,
      });

      totalBudget += proj.po_value;
      totalActual += actual;
    }

    const totalRemaining = totalBudget - totalActual;
    const totalPercentUsed =
      totalBudget > 0
        ? Math.round((totalActual / totalBudget) * 100 * 10) / 10
        : 0;

    return {
      client_name: clientName,
      projects,
      total_budget: Math.round(totalBudget * 100) / 100,
      total_actual: Math.round(totalActual * 100) / 100,
      total_remaining: Math.round(totalRemaining * 100) / 100,
      total_percent_used: totalPercentUsed,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error calculating client budget:', err);
    throw new AppError('Failed to calculate client budget', 500);
  }
}

/**
 * Get overall dashboard for a division (all projects, grouped by cost type)
 */
export async function getDivisionDashboard(
  divisionId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{
  division_name: string;
  date_range: { from: string; to: string };
  metrics: DashboardMetrics;
  by_cost_type: Record<
    string,
    {
      budget: number;
      actual: number;
      remaining: number;
      percent_used: number;
    }
  >;
  projects: Array<{
    project_id: string;
    project_name: string;
    budget: number;
    actual: number;
    remaining: number;
    percent_used: number;
  }>;
}> {
  try {
    // Get division name
    const divResult = await query<{ division_name: string }>(
      'SELECT division_name FROM divisions WHERE division_id = $1',
      [divisionId]
    );

    if (divResult.rowCount === 0) {
      throw new AppError('Division not found', 404);
    }

    const divisionName = divResult.rows[0].division_name;

    // Set default date range to current month
    const today = new Date();
    const from = dateFrom || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const to = dateTo || today.toISOString().split('T')[0];

    // Get all projects in division
    const projectsResult = await query<{
      project_id: string;
      project_name: string;
      po_value: number;
    }>(
      `SELECT project_id, project_name, po_value FROM projects WHERE division_id = $1`,
      [divisionId]
    );

    const projects = [];
    let totalBudget = 0;
    let totalActual = 0;
    const costTypeMap: Record<
      string,
      { budget: number; actual: number }
    > = {
      LABOUR: { budget: 0, actual: 0 },
      EQUIPMENT: { budget: 0, actual: 0 },
      MATERIAL: { budget: 0, actual: 0 },
      FREIGHT: { budget: 0, actual: 0 },
    };

    for (const proj of projectsResult.rows) {
      // Get cost code budgets by type
      const ccResult = await query<{
        cost_type: string;
        budget_allocated: number;
      }>(
        `SELECT cost_type, budget_allocated FROM project_cost_codes WHERE project_id = $1`,
        [proj.project_id]
      );

      for (const cc of ccResult.rows) {
        if (costTypeMap[cc.cost_type]) {
          costTypeMap[cc.cost_type].budget += cc.budget_allocated;
        }
      }

      // Get actual costs
      const timeResult = await query<{ total: number }>(
        `SELECT SUM(total_cost) as total FROM daily_time_entries
         WHERE project_id = $1 AND date_of_work BETWEEN $2 AND $3`,
        [proj.project_id, from, to]
      );

      const eqResult = await query<{ total: number }>(
        `SELECT SUM(total_cost) as total FROM daily_equipment_entries
         WHERE project_id = $1 AND date_of_work BETWEEN $2 AND $3`,
        [proj.project_id, from, to]
      );

      const matResult = await query<{ total: number }>(
        `SELECT SUM(amount) as total FROM daily_material_entries
         WHERE project_id = $1 AND invoice_date BETWEEN $2 AND $3`,
        [proj.project_id, from, to]
      );

      const actual =
        (timeResult.rows[0]?.total || 0) +
        (eqResult.rows[0]?.total || 0) +
        (matResult.rows[0]?.total || 0);

      const remaining = proj.po_value - actual;
      const percentUsed =
        proj.po_value > 0
          ? Math.round((actual / proj.po_value) * 100 * 10) / 10
          : 0;

      projects.push({
        project_id: proj.project_id,
        project_name: proj.project_name,
        budget: Math.round(proj.po_value * 100) / 100,
        actual: Math.round(actual * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percent_used: percentUsed,
      });

      totalBudget += proj.po_value;
      totalActual += actual;

      // Accumulate actual costs by type
      costTypeMap.LABOUR.actual += timeResult.rows[0]?.total || 0;
      costTypeMap.EQUIPMENT.actual += eqResult.rows[0]?.total || 0;
      costTypeMap.MATERIAL.actual += matResult.rows[0]?.total || 0;
    }

    const totalRemaining = totalBudget - totalActual;
    const totalPercentUsed =
      totalBudget > 0
        ? Math.round((totalActual / totalBudget) * 100 * 10) / 10
        : 0;

    // Build by_cost_type response
    const byCostType: Record<
      string,
      { budget: number; actual: number; remaining: number; percent_used: number }
    > = {};

    for (const [type, costs] of Object.entries(costTypeMap)) {
      const remaining = costs.budget - costs.actual;
      const percentUsed =
        costs.budget > 0
          ? Math.round((costs.actual / costs.budget) * 100 * 10) / 10
          : 0;

      byCostType[type] = {
        budget: Math.round(costs.budget * 100) / 100,
        actual: Math.round(costs.actual * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percent_used: percentUsed,
      };
    }

    return {
      division_name: divisionName,
      date_range: { from, to },
      metrics: {
        total_budget: Math.round(totalBudget * 100) / 100,
        total_actual: Math.round(totalActual * 100) / 100,
        total_remaining: Math.round(totalRemaining * 100) / 100,
        total_percent_used: totalPercentUsed,
        project_count: projectsResult.rowCount,
        active_projects: projectsResult.rowCount,
        completed_projects: 0,
      },
      by_cost_type: byCostType,
      projects,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error calculating division dashboard:', err);
    throw new AppError('Failed to calculate division dashboard', 500);
  }
}

export default {
  getBudgetBreakdown,
  getClientBudget,
  getDivisionDashboard,
};

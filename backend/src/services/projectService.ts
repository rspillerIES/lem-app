import { query } from '../config/database';
import {
  Project,
  ProjectCostCode,
  BillingLine,
  Employee,
  Equipment,
  PositionRate,
  ProjectFilters,
} from '../types';
import { AppError } from '../middleware/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Project Service
 * Handles project creation, configuration, cost code setup, employee/equipment management
 */

/**
 * Get all projects (filtered by user's divisions)
 */
export async function getProjects(
  assignedDivisions: string[],
  filters?: ProjectFilters
): Promise<{
  projects: Project[];
  total: number;
}> {
  try {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Build where clause based on filters
    let whereClause = `WHERE p.division_id = ANY($1)`;
    const params: any[] = [assignedDivisions];
    let paramIndex = 2;

    if (filters?.division_id) {
      whereClause += ` AND p.division_id = $${paramIndex}`;
      params.push(filters.division_id);
      paramIndex++;
    }

    if (filters?.client_id) {
      whereClause += ` AND p.client_id = $${paramIndex}`;
      params.push(filters.client_id);
      paramIndex++;
    }

    if (filters?.status === 'active') {
      whereClause += ` AND p.client_approval_locked = FALSE`;
    } else if (filters?.status === 'completed') {
      whereClause += ` AND p.client_approval_locked = TRUE`;
    }

    // Get total count
    const countResult = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM projects p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count as any);

    // Get paginated results
    const result = await query<Project>(
      `SELECT p.*, c.client_name FROM projects p
       LEFT JOIN clients c ON p.client_id = c.client_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      projects: result.rows,
      total,
    };
  } catch (err) {
    console.error('Error fetching projects:', err);
    throw new AppError('Failed to fetch projects', 500);
  }
}

/**
 * Get project by ID with full configuration
 */
export async function getProjectById(projectId: string): Promise<{
  project: Project;
  billingLines: BillingLine[];
  costCodes: ProjectCostCode[];
  employees: Employee[];
  positionRates: PositionRate[];
  equipment: Equipment[];
}> {
  try {
    // Get project
    const projectResult = await query<Project>(
      'SELECT * FROM projects WHERE project_id = $1',
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    // Get billing lines
    const billingLinesResult = await query<BillingLine>(
      'SELECT * FROM billing_lines WHERE project_id = $1 ORDER BY line_number',
      [projectId]
    );

    // Get cost codes
    const costCodesResult = await query<ProjectCostCode>(
      'SELECT * FROM project_cost_codes WHERE project_id = $1',
      [projectId]
    );

    // Get employees
    const employeesResult = await query<Employee>(
      'SELECT * FROM employees WHERE project_id = $1',
      [projectId]
    );

    // Get position rates (project-specific if they exist, otherwise company-level)
    const ratesResult = await query<PositionRate>(
      `SELECT r.* FROM project_position_rates r
       WHERE r.project_id = $1
       UNION
       SELECT r.* FROM position_rates r
       WHERE r.company_id = (SELECT company_id FROM projects WHERE project_id = $1)
       AND NOT EXISTS (SELECT 1 FROM project_position_rates pr WHERE pr.project_id = $1)`,
      [projectId]
    );

    // Get equipment
    const equipmentResult = await query<Equipment>(
      'SELECT * FROM equipment WHERE project_id = $1',
      [projectId]
    );

    return {
      project,
      billingLines: billingLinesResult.rows,
      costCodes: costCodesResult.rows,
      employees: employeesResult.rows,
      positionRates: ratesResult.rows,
      equipment: equipmentResult.rows,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error fetching project:', err);
    throw new AppError('Failed to fetch project', 500);
  }
}

/**
 * Create a new project
 */
export async function createProject(data: {
  company_id: string;
  client_id: string;
  division_id: string;
  project_name: string;
  project_number: string;
  po_number: string;
  po_value: number;
  budget_type: 'PROJECT' | 'SERVICE';
  start_date?: string;
  end_date?: string;
  pm_name?: string;
  foreman_name?: string;
  division_manager_name?: string;
}): Promise<Project> {
  const {
    company_id,
    client_id,
    division_id,
    project_name,
    project_number,
    po_number,
    po_value,
    budget_type,
    start_date,
    end_date,
    pm_name,
    foreman_name,
    division_manager_name,
  } = data;

  try {
    const projectId = uuidv4();

    const result = await query<Project>(
      `INSERT INTO projects (
        project_id, company_id, client_id, division_id, project_name,
        project_number, po_number, po_value, budget_type, start_date,
        end_date, pm_name, foreman_name, division_manager_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        projectId,
        company_id,
        client_id,
        division_id,
        project_name,
        project_number,
        po_number,
        po_value,
        budget_type,
        start_date,
        end_date,
        pm_name,
        foreman_name,
        division_manager_name,
      ]
    );

    return result.rows[0];
  } catch (err) {
    console.error('Error creating project:', err);
    throw new AppError('Failed to create project', 500);
  }
}

/**
 * Add billing lines to a project
 */
export async function addBillingLines(
  projectId: string,
  lines: Array<{ line_number: number; line_name: string }>
): Promise<BillingLine[]> {
  try {
    const results: BillingLine[] = [];

    for (const line of lines) {
      const billingLineId = uuidv4();
      const result = await query<BillingLine>(
        `INSERT INTO billing_lines (billing_line_id, project_id, line_number, line_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [billingLineId, projectId, line.line_number, line.line_name]
      );
      results.push(result.rows[0]);
    }

    return results;
  } catch (err) {
    console.error('Error adding billing lines:', err);
    throw new AppError('Failed to add billing lines', 500);
  }
}

/**
 * Add cost codes to a project
 */
export async function addCostCodes(
  projectId: string,
  codes: Array<{
    cost_code_id: string;
    description: string;
    cost_type: string;
    billing_line_id: string;
    budget_allocated: number;
    execution_phase?: string;
    jonas_cost_type?: string;
  }>
): Promise<ProjectCostCode[]> {
  try {
    const results: ProjectCostCode[] = [];

    for (const code of codes) {
      const id = uuidv4();
      const result = await query<ProjectCostCode>(
        `INSERT INTO project_cost_codes (
          project_cost_code_id, project_id, cost_code_id, description, cost_type,
          billing_line_id, budget_allocated, execution_phase, jonas_cost_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          id,
          projectId,
          code.cost_code_id,
          code.description,
          code.cost_type,
          code.billing_line_id,
          code.budget_allocated,
          code.execution_phase,
          code.jonas_cost_type,
        ]
      );
      results.push(result.rows[0]);
    }

    return results;
  } catch (err) {
    console.error('Error adding cost codes:', err);
    throw new AppError('Failed to add cost codes', 500);
  }
}

/**
 * Assign employees to a project
 */
export async function assignEmployeesToProject(
  projectId: string,
  employeeIds: string[]
): Promise<Employee[]> {
  try {
    const results: Employee[] = [];

    for (const empId of employeeIds) {
      // Get employee details from company_employees
      const companyEmpResult = await query<{
        employee_name: string;
        position_name: string;
      }>(
        `SELECT employee_name, position_name FROM company_employees WHERE employee_id = $1`,
        [empId]
      );

      if (companyEmpResult.rowCount === 0) {
        throw new AppError(`Employee ${empId} not found`, 404);
      }

      const { employee_name, position_name } = companyEmpResult.rows[0];
      const projectEmpId = uuidv4();

      const result = await query<Employee>(
        `INSERT INTO employees (employee_id, project_id, employee_name, position_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [projectEmpId, projectId, employee_name, position_name]
      );

      results.push(result.rows[0]);
    }

    return results;
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error assigning employees:', err);
    throw new AppError('Failed to assign employees', 500);
  }
}

/**
 * Add equipment to a project
 */
export async function addEquipment(
  projectId: string,
  equipment: Array<{
    equipment_name: string;
    daily_rate?: number;
    weekly_rate?: number;
    monthly_rate?: number;
    cost_code_id?: string;
  }>
): Promise<Equipment[]> {
  try {
    const results: Equipment[] = [];

    for (const eq of equipment) {
      const eqId = uuidv4();
      const result = await query<Equipment>(
        `INSERT INTO equipment (equipment_id, project_id, equipment_name, daily_rate, weekly_rate, monthly_rate, cost_code_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          eqId,
          projectId,
          eq.equipment_name,
          eq.daily_rate,
          eq.weekly_rate,
          eq.monthly_rate,
          eq.cost_code_id,
        ]
      );
      results.push(result.rows[0]);
    }

    return results;
  } catch (err) {
    console.error('Error adding equipment:', err);
    throw new AppError('Failed to add equipment', 500);
  }
}

/**
 * Copy position rates from another project
 */
export async function copyPositionRates(
  fromProjectId: string,
  toProjectId: string,
  adjustments?: Record<string, { regular_rate: number; overtime_rate: number; travel_time_rate: number }>
): Promise<PositionRate[]> {
  try {
    // Get rates from source project
    const sourceRates = await query<PositionRate>(
      'SELECT * FROM project_position_rates WHERE project_id = $1',
      [fromProjectId]
    );

    const results: PositionRate[] = [];

    for (const rate of sourceRates.rows) {
      const adjustment = adjustments?.[rate.position_name];
      const newRate = adjustment || {
        regular_rate: rate.regular_rate,
        overtime_rate: rate.overtime_rate,
        travel_time_rate: rate.travel_time_rate,
      };

      const rateId = uuidv4();
      const result = await query<PositionRate>(
        `INSERT INTO project_position_rates (
          rate_id, project_id, position_name, regular_rate, overtime_rate, travel_time_rate, blended_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          rateId,
          toProjectId,
          rate.position_name,
          newRate.regular_rate,
          newRate.overtime_rate,
          newRate.travel_time_rate,
          rate.blended_rate,
        ]
      );

      results.push(result.rows[0]);
    }

    return results;
  } catch (err) {
    console.error('Error copying position rates:', err);
    throw new AppError('Failed to copy position rates', 500);
  }
}

/**
 * Copy equipment from another project
 */
export async function copyEquipment(
  fromProjectId: string,
  toProjectId: string
): Promise<Equipment[]> {
  try {
    const sourceEquipment = await query<Equipment>(
      'SELECT * FROM equipment WHERE project_id = $1',
      [fromProjectId]
    );

    const results: Equipment[] = [];

    for (const eq of sourceEquipment.rows) {
      const eqId = uuidv4();
      const result = await query<Equipment>(
        `INSERT INTO equipment (equipment_id, project_id, equipment_name, daily_rate, weekly_rate, monthly_rate, cost_code_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          eqId,
          toProjectId,
          eq.equipment_name,
          eq.daily_rate,
          eq.weekly_rate,
          eq.monthly_rate,
          eq.cost_code_id,
        ]
      );

      results.push(result.rows[0]);
    }

    return results;
  } catch (err) {
    console.error('Error copying equipment:', err);
    throw new AppError('Failed to copy equipment', 500);
  }
}

/**
 * Lock project (client approval)
 */
export async function lockProject(projectId: string): Promise<Project> {
  try {
    const result = await query<Project>(
      `UPDATE projects
       SET client_approval_locked = TRUE, client_approval_date = CURRENT_TIMESTAMP
       WHERE project_id = $1
       RETURNING *`,
      [projectId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Project not found', 404);
    }

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error locking project:', err);
    throw new AppError('Failed to lock project', 500);
  }
}

/**
 * Unlock project (remove client approval)
 */
export async function unlockProject(projectId: string): Promise<Project> {
  try {
    const result = await query<Project>(
      `UPDATE projects
       SET client_approval_locked = FALSE, client_approval_date = NULL
       WHERE project_id = $1
       RETURNING *`,
      [projectId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Project not found', 404);
    }

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error unlocking project:', err);
    throw new AppError('Failed to unlock project', 500);
  }
}

export default {
  getProjects,
  getProjectById,
  createProject,
  addBillingLines,
  addCostCodes,
  assignEmployeesToProject,
  addEquipment,
  copyPositionRates,
  copyEquipment,
  lockProject,
  unlockProject,
};

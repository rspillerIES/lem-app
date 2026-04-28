import { query } from '../config/database';
import {
  DailyTimeEntry,
  DailyEquipmentEntry,
  DailyMaterialEntry,
  PositionRate,
  EntryFilters,
  Employee,
} from '../types';
import { AppError } from '../middleware/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Entry Service
 * Handles daily time, equipment, and material entry creation and retrieval
 */

/**
 * Get position rates (project-specific or company-level)
 */
async function getPositionRates(
  projectId: string,
  positionName: string
): Promise<PositionRate | null> {
  try {
    // First check project-specific rates
    const projectRateResult = await query<PositionRate>(
      `SELECT * FROM project_position_rates
       WHERE project_id = $1 AND position_name = $2`,
      [projectId, positionName]
    );

    if (projectRateResult.rowCount > 0) {
      return projectRateResult.rows[0];
    }

    // Fall back to company-level rates
    const companyRateResult = await query<PositionRate & { company_id: string }>(
      `SELECT pr.* FROM position_rates pr
       JOIN projects p ON p.company_id = pr.company_id
       WHERE p.project_id = $1 AND pr.position_name = $2`,
      [projectId, positionName]
    );

    if (companyRateResult.rowCount > 0) {
      return companyRateResult.rows[0];
    }

    return null;
  } catch (err) {
    console.error('Error fetching position rates:', err);
    throw new AppError('Failed to fetch position rates', 500);
  }
}

/**
 * Save a time entry
 */
export async function saveTimeEntry(data: {
  project_id: string;
  date_of_work: string;
  employee_id: string;
  cost_code_id: string;
  regular_hours: number;
  overtime_hours: number;
  travel_hours: number;
  comments?: string;
  entered_by?: string;
}): Promise<DailyTimeEntry> {
  try {
    const {
      project_id,
      date_of_work,
      employee_id,
      cost_code_id,
      regular_hours,
      overtime_hours,
      travel_hours,
      comments,
      entered_by,
    } = data;

    // Validate inputs
    if (!employee_id || !cost_code_id) {
      throw new AppError('Employee and cost code are required', 400);
    }

    if (regular_hours < 0 || overtime_hours < 0 || travel_hours < 0) {
      throw new AppError('Hours cannot be negative', 400);
    }

    // Get employee
    const empResult = await query<Employee>(
      'SELECT * FROM employees WHERE employee_id = $1 AND project_id = $2',
      [employee_id, project_id]
    );

    if (empResult.rowCount === 0) {
      throw new AppError('Employee not found in project', 404, 'employee_id');
    }

    const employee = empResult.rows[0];

    // Get position rates
    const rates = await getPositionRates(project_id, employee.position_name);

    if (!rates) {
      throw new AppError(
        `No rates found for position ${employee.position_name}`,
        400
      );
    }

    // Calculate costs
    const regularCost = regular_hours * rates.regular_rate;
    const overtimeCost = overtime_hours * rates.overtime_rate;
    const travelCost = travel_hours * rates.travel_time_rate;
    const totalCost = regularCost + overtimeCost + travelCost;

    // Save entry
    const timeEntryId = uuidv4();
    const result = await query<DailyTimeEntry>(
      `INSERT INTO daily_time_entries (
        time_entry_id, project_id, date_of_work, employee_id, cost_code_id,
        position_name, regular_hours, overtime_hours, travel_hours,
        regular_rate, overtime_rate, travel_rate,
        regular_cost, overtime_cost, travel_cost, total_cost,
        comments, entered_by, is_locked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        timeEntryId,
        project_id,
        date_of_work,
        employee_id,
        cost_code_id,
        employee.position_name,
        regular_hours,
        overtime_hours,
        travel_hours,
        rates.regular_rate,
        rates.overtime_rate,
        rates.travel_time_rate,
        regularCost,
        overtimeCost,
        travelCost,
        totalCost,
        comments,
        entered_by,
        false, // not locked initially
      ]
    );

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error saving time entry:', err);
    throw new AppError('Failed to save time entry', 500);
  }
}

/**
 * Save an equipment entry
 */
export async function saveEquipmentEntry(data: {
  project_id: string;
  date_of_work: string;
  equipment_id: string;
  cost_code_id: string;
  usage_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  quantity: number;
  comments?: string;
  entered_by?: string;
}): Promise<DailyEquipmentEntry> {
  try {
    const {
      project_id,
      date_of_work,
      equipment_id,
      cost_code_id,
      usage_type,
      quantity,
      comments,
      entered_by,
    } = data;

    // Validate inputs
    if (!equipment_id || !cost_code_id) {
      throw new AppError('Equipment and cost code are required', 400);
    }

    if (quantity <= 0) {
      throw new AppError('Quantity must be greater than 0', 400);
    }

    // Get equipment and rate
    const eqResult = await query<any>(
      `SELECT * FROM equipment WHERE equipment_id = $1 AND project_id = $2`,
      [equipment_id, project_id]
    );

    if (eqResult.rowCount === 0) {
      throw new AppError('Equipment not found', 404);
    }

    const equipment = eqResult.rows[0];

    // Determine rate based on usage type
    let rate: number | null = null;
    if (usage_type === 'DAILY') rate = equipment.daily_rate;
    else if (usage_type === 'WEEKLY') rate = equipment.weekly_rate;
    else if (usage_type === 'MONTHLY') rate = equipment.monthly_rate;

    if (!rate) {
      throw new AppError(
        `No ${usage_type.toLowerCase()} rate configured for this equipment`,
        400
      );
    }

    const totalCost = quantity * rate;

    // Save entry
    const eqEntryId = uuidv4();
    const result = await query<DailyEquipmentEntry>(
      `INSERT INTO daily_equipment_entries (
        equipment_entry_id, project_id, date_of_work, equipment_id, cost_code_id,
        usage_type, quantity, rate, total_cost, comments, entered_by, is_locked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        eqEntryId,
        project_id,
        date_of_work,
        equipment_id,
        cost_code_id,
        usage_type,
        quantity,
        rate,
        totalCost,
        comments,
        entered_by,
        false, // not locked initially
      ]
    );

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error saving equipment entry:', err);
    throw new AppError('Failed to save equipment entry', 500);
  }
}

/**
 * Save a material entry
 */
export async function saveMaterialEntry(data: {
  project_id: string;
  invoice_date: string;
  invoice_po_number?: string;
  vendor?: string;
  description: string;
  cost_code_id: string;
  billing_line_id: string;
  amount: number;
  entered_by?: string;
}): Promise<DailyMaterialEntry> {
  try {
    const {
      project_id,
      invoice_date,
      invoice_po_number,
      vendor,
      description,
      cost_code_id,
      billing_line_id,
      amount,
      entered_by,
    } = data;

    // Validate inputs
    if (!description || !cost_code_id) {
      throw new AppError('Description and cost code are required', 400);
    }

    if (amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400);
    }

    // Save entry
    const matEntryId = uuidv4();
    const result = await query<DailyMaterialEntry>(
      `INSERT INTO daily_material_entries (
        material_entry_id, project_id, invoice_date, invoice_po_number, vendor,
        description, cost_code_id, billing_line_id, amount, entered_by, is_locked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        matEntryId,
        project_id,
        invoice_date,
        invoice_po_number,
        vendor,
        description,
        cost_code_id,
        billing_line_id,
        amount,
        entered_by,
        false, // not locked initially
      ]
    );

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error saving material entry:', err);
    throw new AppError('Failed to save material entry', 500);
  }
}

/**
 * Get all entries for a project (time, equipment, material)
 */
export async function getEntries(
  projectId: string,
  filters?: EntryFilters
): Promise<{
  entries: any[];
  total: number;
}> {
  try {
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;
    const entryType = filters?.entry_type || 'all';

    let whereClause = 'WHERE project_id = $1';
    const params: any[] = [projectId];
    let paramIndex = 2;

    if (filters?.date_from) {
      whereClause += ` AND (date_of_work >= $${paramIndex} OR invoice_date >= $${paramIndex})`;
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters?.date_to) {
      whereClause += ` AND (date_of_work <= $${paramIndex} OR invoice_date <= $${paramIndex})`;
      params.push(filters.date_to);
      paramIndex++;
    }

    if (filters?.cost_code_id) {
      whereClause += ` AND cost_code_id = $${paramIndex}`;
      params.push(filters.cost_code_id);
      paramIndex++;
    }

    // Fetch entries based on type
    const allEntries: any[] = [];

    if (entryType === 'time' || entryType === 'all') {
      const timeResult = await query<any>(
        `SELECT *, 'TIME' as entry_type FROM daily_time_entries ${whereClause}
         ORDER BY date_of_work DESC`,
        params
      );
      allEntries.push(...timeResult.rows);
    }

    if (entryType === 'equipment' || entryType === 'all') {
      const eqResult = await query<any>(
        `SELECT *, 'EQUIPMENT' as entry_type FROM daily_equipment_entries ${whereClause}
         ORDER BY date_of_work DESC`,
        params
      );
      allEntries.push(...eqResult.rows);
    }

    if (entryType === 'material' || entryType === 'all') {
      const matResult = await query<any>(
        `SELECT *, 'MATERIAL' as entry_type FROM daily_material_entries ${whereClause}
         ORDER BY invoice_date DESC`,
        params
      );
      allEntries.push(...matResult.rows);
    }

    // Sort all entries by date
    const sortedEntries = allEntries.sort(
      (a, b) =>
        new Date(b.date_of_work || b.invoice_date).getTime() -
        new Date(a.date_of_work || a.invoice_date).getTime()
    );

    // Apply pagination
    const paginatedEntries = sortedEntries.slice(offset, offset + limit);

    return {
      entries: paginatedEntries,
      total: sortedEntries.length,
    };
  } catch (err) {
    console.error('Error fetching entries:', err);
    throw new AppError('Failed to fetch entries', 500);
  }
}

/**
 * Get daily summary (total cost by cost code for a specific date)
 */
export async function getDailySummary(
  projectId: string,
  date: string
): Promise<{
  date: string;
  entries: Array<{
    cost_code_id: string;
    entry_count: number;
    total_cost: number;
  }>;
  daily_total: number;
}> {
  try {
    // Get time + equipment entries for the date
    const result = await query<{
      cost_code_id: string;
      total_cost: number;
    }>(
      `(SELECT cost_code_id, SUM(total_cost) as total_cost FROM daily_time_entries
        WHERE project_id = $1 AND date_of_work = $2
        GROUP BY cost_code_id)
       UNION ALL
       (SELECT cost_code_id, SUM(total_cost) as total_cost FROM daily_equipment_entries
        WHERE project_id = $1 AND date_of_work = $2
        GROUP BY cost_code_id)
       UNION ALL
       (SELECT cost_code_id, SUM(amount) as total_cost FROM daily_material_entries
        WHERE project_id = $1 AND invoice_date = $2
        GROUP BY cost_code_id)`,
      [projectId, date]
    );

    // Aggregate by cost code
    const costCodeMap: Record<string, { count: number; cost: number }> = {};

    for (const row of result.rows) {
      if (!costCodeMap[row.cost_code_id]) {
        costCodeMap[row.cost_code_id] = { count: 0, cost: 0 };
      }
      costCodeMap[row.cost_code_id].count++;
      costCodeMap[row.cost_code_id].cost += row.total_cost;
    }

    const entries = Object.entries(costCodeMap).map(([ccId, data]) => ({
      cost_code_id: ccId,
      entry_count: data.count,
      total_cost: Math.round(data.cost * 100) / 100, // Round to 2 decimals
    }));

    const dailyTotal = entries.reduce((sum, e) => sum + e.total_cost, 0);

    return {
      date,
      entries,
      daily_total: Math.round(dailyTotal * 100) / 100,
    };
  } catch (err) {
    console.error('Error fetching daily summary:', err);
    throw new AppError('Failed to fetch daily summary', 500);
  }
}

export default {
  saveTimeEntry,
  saveEquipmentEntry,
  saveMaterialEntry,
  getEntries,
  getDailySummary,
};

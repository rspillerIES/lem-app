import { query } from '../config/database';
import { AppError } from '../middleware/errors';

/**
 * Export Service
 * Handles Jonas CSV export (with H01/H02/H04 logic) and PDF generation
 */

/**
 * Get employee code from name
 * TODO: Once company_employees table is populated with codes, use that instead
 */
function getEmployeeCode(employeeName: string): string {
  // For MVP, generate code from name (first 6 chars of last name + first 2 of first)
  // In production, look up from company_employees.employee_code
  const parts = employeeName.split(' ');
  if (parts.length >= 2) {
    return (
      parts[parts.length - 1].substring(0, 5) +
      parts[0].substring(0, 2)
    ).toUpperCase();
  }
  return employeeName.substring(0, 7).toUpperCase();
}

/**
 * Export time and equipment entries to Jonas CSV format
 * Format: TAB-delimited with H01 (regular), H02 (OT), H04 (travel) logic
 * Travel hours must be on separate line
 */
export async function exportToJonasCSV(
  projectId: string,
  dateFrom: string,
  dateTo: string,
  includeEntries: Array<'TIME' | 'EQUIPMENT'> = ['TIME', 'EQUIPMENT']
): Promise<string> {
  try {
    const lines: string[] = [];

    // Header comment (optional, some systems ignore)
    lines.push(`# Jonas Import Export`);
    lines.push(`# Date Range: ${dateFrom} to ${dateTo}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Get project details for GL account mapping
    const projectResult = await query<{ project_number: string }>(
      'SELECT project_number FROM projects WHERE project_id = $1',
      [projectId]
    );

    if (projectResult.rowCount === 0) {
      throw new AppError('Project not found', 404);
    }

    const jobNumber = projectResult.rows[0].project_number;

    // EXPORT TIME ENTRIES
    if (includeEntries.includes('TIME')) {
      const timeResult = await query<any>(
        `SELECT e.employee_name, t.date_of_work, t.regular_hours, t.overtime_hours, 
                t.travel_hours, t.cost_code_id, p.jonas_cost_type
         FROM daily_time_entries t
         JOIN employees e ON t.employee_id = e.employee_id
         JOIN project_cost_codes p ON t.project_id = p.project_id AND t.cost_code_id = p.cost_code_id
         WHERE t.project_id = $1 
         AND t.date_of_work BETWEEN $2 AND $3
         ORDER BY t.date_of_work, e.employee_name`,
        [projectId, dateFrom, dateTo]
      );

      for (const entry of timeResult.rows) {
        const empCode = getEmployeeCode(entry.employee_name);
        const dateStr = formatDateForJonas(entry.date_of_work); // MM/DD/YYYY

        // Line 1: Regular + Overtime (H01, H02)
        // Format: KAMMU | 04/27/2026 | 8 | 2 | (blank) | (blank) | (blank) | 26-0007 | 10100 | L
        if (entry.regular_hours > 0 || entry.overtime_hours > 0) {
          const line = [
            empCode, // A: Employee Code
            dateStr, // B: Date Worked (MM/DD/YYYY)
            entry.regular_hours > 0 ? entry.regular_hours : '', // C: Regular Hrs (H01)
            entry.overtime_hours > 0 ? entry.overtime_hours : '', // D: Overtime Hrs (H02)
            '', // E: Doubletime Hrs (H03) - blank
            '', // F: P/R Code - blank
            '', // G: Amount/Hours - blank
            jobNumber, // H: Post To GL Acct (Job)
            '10100', // I: GL Dept
            entry.jonas_cost_type || 'L', // J: Cost Type
          ];
          lines.push(line.join('\t'));
        }

        // Line 2: Travel Time (H04) - MUST be separate line
        if (entry.travel_hours > 0) {
          const line = [
            empCode, // A: Employee Code
            dateStr, // B: Date Worked
            '', // C: Regular - blank
            '', // D: Overtime - blank
            '', // E: Doubletime - blank
            'H04', // F: P/R Code = H04 for Travel
            entry.travel_hours, // G: Hours for H04
            jobNumber, // H: Post To GL Acct
            '10100', // I: GL Dept
            entry.jonas_cost_type || 'L', // J: Cost Type
          ];
          lines.push(line.join('\t'));
        }
      }
    }

    // EXPORT EQUIPMENT ENTRIES
    if (includeEntries.includes('EQUIPMENT')) {
      const eqResult = await query<any>(
        `SELECT e.equipment_name, eq.date_of_work, eq.usage_type, eq.quantity, 
                eq.cost_code_id, p.jonas_cost_type
         FROM daily_equipment_entries eq
         JOIN equipment e ON eq.equipment_id = e.equipment_id
         JOIN project_cost_codes p ON eq.project_id = p.project_id AND eq.cost_code_id = p.cost_code_id
         WHERE eq.project_id = $1 
         AND eq.date_of_work BETWEEN $2 AND $3
         ORDER BY eq.date_of_work, e.equipment_name`,
        [projectId, dateFrom, dateTo]
      );

      for (const entry of eqResult.rows) {
        const dateStr = formatDateForJonas(entry.date_of_work);
        const unitCode = getUnitCode(entry.usage_type); // H (hours), D (days), W (weeks), M (months)

        const line = [
          entry.equipment_name.substring(0, 20), // A: Equipment Code/Name
          dateStr, // B: Date
          entry.quantity, // C: Quantity
          '', // D: Rate - blank (or include if available)
          '', // E: blank
          '', // F: blank
          '', // G: blank
          jobNumber, // H: Post To Job
          '10100', // I: GL Dept
          entry.jonas_cost_type || 'E', // J: Cost Type
          '', // K: Equipment Unit
        ];
        lines.push(line.join('\t'));
      }
    }

    return lines.join('\n');
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error exporting to Jonas:', err);
    throw new AppError('Failed to export to Jonas format', 500);
  }
}

/**
 * Export daily LEM to CSV format (simplified daily report)
 */
export async function exportToDailyLEMCSV(
  projectId: string,
  dateFrom: string,
  dateTo: string
): Promise<string> {
  try {
    const lines: string[] = [];

    // Header
    lines.push('Impact Daily LEM Report');
    lines.push(`Date Range: ${dateFrom} to ${dateTo}`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Get project details
    const projResult = await query<any>(
      `SELECT project_name, project_number, po_number FROM projects WHERE project_id = $1`,
      [projectId]
    );

    const proj = projResult.rows[0];
    lines.push(`Project: ${proj.project_name}`);
    lines.push(`Project Number: ${proj.project_number}`);
    lines.push(`PO Number: ${proj.po_number}`);
    lines.push('');

    // Time Entries by Date
    lines.push('=== LABOR ===');
    lines.push(
      [
        'Date',
        'Employee',
        'Position',
        'Cost Code',
        'Regular Hrs',
        'OT Hrs',
        'Travel Hrs',
        'Regular Cost',
        'OT Cost',
        'Travel Cost',
        'Total Cost',
      ].join('\t')
    );

    const timeResult = await query<any>(
      `SELECT t.date_of_work, e.employee_name, t.position_name, t.cost_code_id,
              t.regular_hours, t.overtime_hours, t.travel_hours,
              t.regular_cost, t.overtime_cost, t.travel_cost, t.total_cost
       FROM daily_time_entries t
       JOIN employees e ON t.employee_id = e.employee_id
       WHERE t.project_id = $1 AND t.date_of_work BETWEEN $2 AND $3
       ORDER BY t.date_of_work, e.employee_name`,
      [projectId, dateFrom, dateTo]
    );

    for (const entry of timeResult.rows) {
      const line = [
        entry.date_of_work,
        entry.employee_name,
        entry.position_name,
        entry.cost_code_id,
        entry.regular_hours || 0,
        entry.overtime_hours || 0,
        entry.travel_hours || 0,
        entry.regular_cost ? entry.regular_cost.toFixed(2) : '0.00',
        entry.overtime_cost ? entry.overtime_cost.toFixed(2) : '0.00',
        entry.travel_cost ? entry.travel_cost.toFixed(2) : '0.00',
        entry.total_cost ? entry.total_cost.toFixed(2) : '0.00',
      ];
      lines.push(line.join('\t'));
    }

    lines.push('');

    // Equipment Entries
    lines.push('=== EQUIPMENT ===');
    lines.push(
      [
        'Date',
        'Equipment',
        'Cost Code',
        'Usage Type',
        'Quantity',
        'Rate',
        'Total Cost',
      ].join('\t')
    );

    const eqResult = await query<any>(
      `SELECT eq.date_of_work, e.equipment_name, eq.cost_code_id, eq.usage_type,
              eq.quantity, eq.rate, eq.total_cost
       FROM daily_equipment_entries eq
       JOIN equipment e ON eq.equipment_id = e.equipment_id
       WHERE eq.project_id = $1 AND eq.date_of_work BETWEEN $2 AND $3
       ORDER BY eq.date_of_work, e.equipment_name`,
      [projectId, dateFrom, dateTo]
    );

    for (const entry of eqResult.rows) {
      const line = [
        entry.date_of_work,
        entry.equipment_name,
        entry.cost_code_id,
        entry.usage_type,
        entry.quantity || 0,
        entry.rate ? entry.rate.toFixed(2) : '0.00',
        entry.total_cost ? entry.total_cost.toFixed(2) : '0.00',
      ];
      lines.push(line.join('\t'));
    }

    lines.push('');

    // Material Entries
    lines.push('=== MATERIAL ===');
    lines.push(
      [
        'Invoice Date',
        'PO Number',
        'Vendor',
        'Description',
        'Cost Code',
        'Amount',
      ].join('\t')
    );

    const matResult = await query<any>(
      `SELECT invoice_date, invoice_po_number, vendor, description, cost_code_id, amount
       FROM daily_material_entries
       WHERE project_id = $1 AND invoice_date BETWEEN $2 AND $3
       ORDER BY invoice_date`,
      [projectId, dateFrom, dateTo]
    );

    for (const entry of matResult.rows) {
      const line = [
        entry.invoice_date,
        entry.invoice_po_number || '',
        entry.vendor || '',
        entry.description,
        entry.cost_code_id,
        entry.amount ? entry.amount.toFixed(2) : '0.00',
      ];
      lines.push(line.join('\t'));
    }

    return lines.join('\n');
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error exporting to CSV:', err);
    throw new AppError('Failed to export to CSV format', 500);
  }
}

/**
 * Helper: Format date for Jonas (MM/DD/YYYY)
 */
function formatDateForJonas(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Helper: Get Jonas unit code for equipment usage type
 */
function getUnitCode(usageType: string): string {
  switch (usageType) {
    case 'DAILY':
      return 'D';
    case 'WEEKLY':
      return 'W';
    case 'MONTHLY':
      return 'M';
    default:
      return 'D';
  }
}

export default {
  exportToJonasCSV,
  exportToDailyLEMCSV,
};

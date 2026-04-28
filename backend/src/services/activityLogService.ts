import { query } from '../config/database';
import { ActivityLog, ActivityLogFilters } from '../types';
import { AppError } from '../middleware/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Activity Log Service
 * Handles daily narrative notes: work performed, material ordered/received, issues
 */

/**
 * Add a new activity log entry
 */
export async function addActivityLog(data: {
  project_id: string;
  date_of_activity: string;
  activity_type: 'WORK_PERFORMED' | 'MATERIAL_ORDERED' | 'MATERIAL_RECEIVED' | 'OTHER';
  notes: string;
  entered_by?: string;
}): Promise<ActivityLog> {
  try {
    const { project_id, date_of_activity, activity_type, notes, entered_by } = data;

    // Validate inputs
    if (!date_of_activity || !notes) {
      throw new AppError('Date and notes are required', 400);
    }

    if (notes.length === 0 || notes.length > 5000) {
      throw new AppError('Notes must be between 1 and 5000 characters', 400);
    }

    const activityId = uuidv4();

    const result = await query<ActivityLog>(
      `INSERT INTO activity_log (
        activity_id, project_id, date_of_activity, activity_type, notes, entered_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [activityId, project_id, date_of_activity, activity_type, notes, entered_by]
    );

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error adding activity log:', err);
    throw new AppError('Failed to add activity log entry', 500);
  }
}

/**
 * Get activity log entries for a project
 */
export async function getActivityLog(
  projectId: string,
  filters?: ActivityLogFilters
): Promise<{
  activities: ActivityLog[];
  total: number;
}> {
  try {
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // Build where clause
    let whereClause = 'WHERE project_id = $1';
    const params: any[] = [projectId];
    let paramIndex = 2;

    if (filters?.date_from) {
      whereClause += ` AND date_of_activity >= $${paramIndex}`;
      params.push(filters.date_from);
      paramIndex++;
    }

    if (filters?.date_to) {
      whereClause += ` AND date_of_activity <= $${paramIndex}`;
      params.push(filters.date_to);
      paramIndex++;
    }

    if (filters?.activity_type) {
      whereClause += ` AND activity_type = $${paramIndex}`;
      params.push(filters.activity_type);
      paramIndex++;
    }

    // Get total count
    const countResult = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM activity_log ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count as any);

    // Get paginated results
    const result = await query<ActivityLog>(
      `SELECT * FROM activity_log ${whereClause}
       ORDER BY date_of_activity DESC, entered_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      activities: result.rows,
      total,
    };
  } catch (err) {
    console.error('Error fetching activity log:', err);
    throw new AppError('Failed to fetch activity log', 500);
  }
}

/**
 * Get activity entries for a specific date
 */
export async function getActivityLogByDate(
  projectId: string,
  date: string
): Promise<ActivityLog[]> {
  try {
    const result = await query<ActivityLog>(
      `SELECT * FROM activity_log
       WHERE project_id = $1 AND date_of_activity = $2
       ORDER BY entered_at DESC`,
      [projectId, date]
    );

    return result.rows;
  } catch (err) {
    console.error('Error fetching activity log by date:', err);
    throw new AppError('Failed to fetch activity log', 500);
  }
}

/**
 * Update an activity log entry
 */
export async function updateActivityLog(
  activityId: string,
  data: {
    date_of_activity?: string;
    activity_type?: string;
    notes?: string;
  }
): Promise<ActivityLog> {
  try {
    const { date_of_activity, activity_type, notes } = data;

    // Validate inputs
    if (notes && (notes.length === 0 || notes.length > 5000)) {
      throw new AppError('Notes must be between 1 and 5000 characters', 400);
    }

    let updateQuery = 'UPDATE activity_log SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];
    let paramIndex = 1;

    if (date_of_activity) {
      updateQuery += `, date_of_activity = $${paramIndex}`;
      params.push(date_of_activity);
      paramIndex++;
    }

    if (activity_type) {
      updateQuery += `, activity_type = $${paramIndex}`;
      params.push(activity_type);
      paramIndex++;
    }

    if (notes) {
      updateQuery += `, notes = $${paramIndex}`;
      params.push(notes);
      paramIndex++;
    }

    updateQuery += ` WHERE activity_id = $${paramIndex} RETURNING *`;
    params.push(activityId);

    const result = await query<ActivityLog>(updateQuery, params);

    if (result.rowCount === 0) {
      throw new AppError('Activity log entry not found', 404);
    }

    return result.rows[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error updating activity log:', err);
    throw new AppError('Failed to update activity log entry', 500);
  }
}

/**
 * Delete an activity log entry
 */
export async function deleteActivityLog(activityId: string): Promise<void> {
  try {
    const result = await query(
      'DELETE FROM activity_log WHERE activity_id = $1',
      [activityId]
    );

    if (result.rowCount === 0) {
      throw new AppError('Activity log entry not found', 404);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error('Error deleting activity log:', err);
    throw new AppError('Failed to delete activity log entry', 500);
  }
}

/**
 * Get activity summary for a date range
 */
export async function getActivitySummary(
  projectId: string,
  dateFrom: string,
  dateTo: string
): Promise<{
  total_entries: number;
  by_type: Record<string, number>;
  date_range: { from: string; to: string };
}> {
  try {
    const result = await query<{ activity_type: string; count: number }>(
      `SELECT activity_type, COUNT(*) as count FROM activity_log
       WHERE project_id = $1 AND date_of_activity BETWEEN $2 AND $3
       GROUP BY activity_type`,
      [projectId, dateFrom, dateTo]
    );

    const byType: Record<string, number> = {};
    let total = 0;

    for (const row of result.rows) {
      byType[row.activity_type || 'OTHER'] = parseInt(row.count as any);
      total += parseInt(row.count as any);
    }

    return {
      total_entries: total,
      by_type: byType,
      date_range: { from: dateFrom, to: dateTo },
    };
  } catch (err) {
    console.error('Error calculating activity summary:', err);
    throw new AppError('Failed to calculate activity summary', 500);
  }
}

export default {
  addActivityLog,
  getActivityLog,
  getActivityLogByDate,
  updateActivityLog,
  deleteActivityLog,
  getActivitySummary,
};

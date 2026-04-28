import { query } from '../config/database';

/**
 * Database migration script
 * Run once to set up all tables and relationships
 */

async function runMigration() {
  console.log('Starting database migration...');

  try {
    // ==================== CORE ORGANIZATION TABLES ====================

    // Companies
    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        company_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created companies table');

    // Divisions
    await query(`
      CREATE TABLE IF NOT EXISTS divisions (
        division_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        division_name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, division_name)
      );
      CREATE INDEX IF NOT EXISTS idx_divisions_company ON divisions(company_id);
    `);
    console.log('✓ Created divisions table');

    // Clients
    await query(`
      CREATE TABLE IF NOT EXISTS clients (
        client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE CASCADE,
        client_name VARCHAR(255) NOT NULL,
        primary_contact VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
      CREATE INDEX IF NOT EXISTS idx_clients_division ON clients(division_id);
    `);
    console.log('✓ Created clients table');

    // Projects
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
        division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE CASCADE,
        project_name VARCHAR(255) NOT NULL,
        project_number VARCHAR(50),
        po_number VARCHAR(50),
        po_value DECIMAL(12, 2) NOT NULL,
        budget_type VARCHAR(20) NOT NULL,
        start_date DATE,
        end_date DATE,
        pm_name VARCHAR(255),
        foreman_name VARCHAR(255),
        division_manager_name VARCHAR(255),
        client_approval_date TIMESTAMP,
        client_approval_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
      CREATE INDEX IF NOT EXISTS idx_projects_division ON projects(division_id);
      CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
    `);
    console.log('✓ Created projects table');

    // ==================== USERS & ROLES ====================

    // Users
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL UNIQUE,
        full_name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✓ Created users table');

    // User Divisions
    await query(`
      CREATE TABLE IF NOT EXISTS user_divisions (
        user_division_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, division_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_divisions_user ON user_divisions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_divisions_division ON user_divisions(division_id);
    `);
    console.log('✓ Created user_divisions table');

    // Default Role Permissions
    await query(`
      CREATE TABLE IF NOT EXISTS default_role_permissions (
        permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        can_enter_time BOOLEAN DEFAULT FALSE,
        can_enter_material BOOLEAN DEFAULT FALSE,
        can_edit_rates BOOLEAN DEFAULT FALSE,
        can_view_budget BOOLEAN DEFAULT FALSE,
        can_lock BOOLEAN DEFAULT FALSE,
        can_approve BOOLEAN DEFAULT FALSE,
        can_export BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, role)
      );
      CREATE INDEX IF NOT EXISTS idx_default_permissions_company ON default_role_permissions(company_id);
    `);
    console.log('✓ Created default_role_permissions table');

    // Project Role Permissions
    await query(`
      CREATE TABLE IF NOT EXISTS project_role_permissions (
        permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        can_enter_time BOOLEAN DEFAULT FALSE,
        can_enter_material BOOLEAN DEFAULT FALSE,
        can_edit_rates BOOLEAN DEFAULT FALSE,
        can_view_budget BOOLEAN DEFAULT FALSE,
        can_lock BOOLEAN DEFAULT FALSE,
        can_approve BOOLEAN DEFAULT FALSE,
        can_export BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, role)
      );
      CREATE INDEX IF NOT EXISTS idx_project_permissions_project ON project_role_permissions(project_id);
    `);
    console.log('✓ Created project_role_permissions table');

    // ==================== RATES & EMPLOYEES ====================

    // Master Cost Codes
    await query(`
      CREATE TABLE IF NOT EXISTS master_cost_codes (
        cost_code_id VARCHAR(50) PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        cost_type VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_master_cc_company ON master_cost_codes(company_id);
    `);
    console.log('✓ Created master_cost_codes table');

    // Position Rates
    await query(`
      CREATE TABLE IF NOT EXISTS position_rates (
        rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        position_name VARCHAR(100) NOT NULL,
        regular_rate DECIMAL(10, 2) NOT NULL,
        overtime_rate DECIMAL(10, 2) NOT NULL,
        travel_time_rate DECIMAL(10, 2) NOT NULL,
        blended_rate DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, position_name)
      );
      CREATE INDEX IF NOT EXISTS idx_position_rates_company ON position_rates(company_id);
    `);
    console.log('✓ Created position_rates table');

    // Project Position Rates
    await query(`
      CREATE TABLE IF NOT EXISTS project_position_rates (
        rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        position_name VARCHAR(100) NOT NULL,
        regular_rate DECIMAL(10, 2) NOT NULL,
        overtime_rate DECIMAL(10, 2) NOT NULL,
        travel_time_rate DECIMAL(10, 2) NOT NULL,
        blended_rate DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, position_name)
      );
      CREATE INDEX IF NOT EXISTS idx_project_position_rates ON project_position_rates(project_id);
    `);
    console.log('✓ Created project_position_rates table');

    // Company Employees (master list)
    await query(`
      CREATE TABLE IF NOT EXISTS company_employees (
        employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
        division_id UUID NOT NULL REFERENCES divisions(division_id) ON DELETE CASCADE,
        employee_name VARCHAR(255) NOT NULL,
        employee_code VARCHAR(50) NOT NULL,
        position_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(division_id, employee_code)
      );
      CREATE INDEX IF NOT EXISTS idx_company_employees_division ON company_employees(division_id);
    `);
    console.log('✓ Created company_employees table');

    // Project Employees
    await query(`
      CREATE TABLE IF NOT EXISTS employees (
        employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        employee_name VARCHAR(255) NOT NULL,
        position_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, employee_name)
      );
      CREATE INDEX IF NOT EXISTS idx_employees_project ON employees(project_id);
    `);
    console.log('✓ Created employees table');

    // Billing Lines
    await query(`
      CREATE TABLE IF NOT EXISTS billing_lines (
        billing_line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        line_number SMALLINT NOT NULL,
        line_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, line_number)
      );
      CREATE INDEX IF NOT EXISTS idx_billing_lines_project ON billing_lines(project_id);
    `);
    console.log('✓ Created billing_lines table');

    // Project Cost Codes
    await query(`
      CREATE TABLE IF NOT EXISTS project_cost_codes (
        project_cost_code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
        description VARCHAR(255),
        cost_type VARCHAR(50) NOT NULL,
        billing_line_id UUID NOT NULL REFERENCES billing_lines(billing_line_id),
        budget_allocated DECIMAL(12, 2),
        execution_phase VARCHAR(100),
        jonas_cost_type VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, cost_code_id)
      );
      CREATE INDEX IF NOT EXISTS idx_project_cc_project ON project_cost_codes(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_cc_cc ON project_cost_codes(cost_code_id);
    `);
    console.log('✓ Created project_cost_codes table');

    // Equipment
    await query(`
      CREATE TABLE IF NOT EXISTS equipment (
        equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        equipment_name VARCHAR(255) NOT NULL,
        daily_rate DECIMAL(10, 2),
        weekly_rate DECIMAL(10, 2),
        monthly_rate DECIMAL(10, 2),
        cost_code_id VARCHAR(50) REFERENCES master_cost_codes(cost_code_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, equipment_name)
      );
      CREATE INDEX IF NOT EXISTS idx_equipment_project ON equipment(project_id);
    `);
    console.log('✓ Created equipment table');

    // ==================== DAILY ENTRIES ====================

    // Daily Time Entries
    await query(`
      CREATE TABLE IF NOT EXISTS daily_time_entries (
        time_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        date_of_work DATE NOT NULL,
        employee_id UUID NOT NULL REFERENCES employees(employee_id),
        cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
        position_name VARCHAR(100) NOT NULL,
        regular_hours DECIMAL(8, 2) DEFAULT 0,
        overtime_hours DECIMAL(8, 2) DEFAULT 0,
        travel_hours DECIMAL(8, 2) DEFAULT 0,
        regular_rate DECIMAL(10, 2),
        overtime_rate DECIMAL(10, 2),
        travel_rate DECIMAL(10, 2),
        regular_cost DECIMAL(12, 2),
        overtime_cost DECIMAL(12, 2),
        travel_cost DECIMAL(12, 2),
        total_cost DECIMAL(12, 2),
        comments TEXT,
        entered_by UUID REFERENCES users(user_id),
        entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_daily_time_project ON daily_time_entries(project_id);
      CREATE INDEX IF NOT EXISTS idx_daily_time_date ON daily_time_entries(date_of_work);
      CREATE INDEX IF NOT EXISTS idx_daily_time_cc ON daily_time_entries(cost_code_id);
      CREATE INDEX IF NOT EXISTS idx_daily_time_employee ON daily_time_entries(employee_id);
      CREATE INDEX IF NOT EXISTS idx_daily_time_project_date_cc ON daily_time_entries(project_id, date_of_work, cost_code_id);
    `);
    console.log('✓ Created daily_time_entries table');

    // Daily Equipment Entries
    await query(`
      CREATE TABLE IF NOT EXISTS daily_equipment_entries (
        equipment_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        date_of_work DATE NOT NULL,
        equipment_id UUID NOT NULL REFERENCES equipment(equipment_id),
        cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
        usage_type VARCHAR(20) NOT NULL,
        quantity DECIMAL(8, 2) NOT NULL,
        rate DECIMAL(10, 2) NOT NULL,
        total_cost DECIMAL(12, 2),
        comments TEXT,
        entered_by UUID REFERENCES users(user_id),
        entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_daily_equip_project ON daily_equipment_entries(project_id);
      CREATE INDEX IF NOT EXISTS idx_daily_equip_date ON daily_equipment_entries(date_of_work);
      CREATE INDEX IF NOT EXISTS idx_daily_equip_cc ON daily_equipment_entries(cost_code_id);
    `);
    console.log('✓ Created daily_equipment_entries table');

    // Daily Material Entries
    await query(`
      CREATE TABLE IF NOT EXISTS daily_material_entries (
        material_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        invoice_date DATE NOT NULL,
        invoice_po_number VARCHAR(50),
        vendor VARCHAR(255),
        description TEXT NOT NULL,
        cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
        billing_line_id UUID NOT NULL REFERENCES billing_lines(billing_line_id),
        amount DECIMAL(12, 2) NOT NULL,
        entered_by UUID REFERENCES users(user_id),
        entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_daily_material_project ON daily_material_entries(project_id);
      CREATE INDEX IF NOT EXISTS idx_daily_material_date ON daily_material_entries(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_daily_material_cc ON daily_material_entries(cost_code_id);
    `);
    console.log('✓ Created daily_material_entries table');

    // ==================== ACTIVITY LOG ====================

    // Activity Log
    await query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        date_of_activity DATE NOT NULL,
        activity_type VARCHAR(50),
        notes TEXT NOT NULL,
        entered_by UUID REFERENCES users(user_id),
        entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);
      CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(date_of_activity);
      CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(activity_type);
      CREATE INDEX IF NOT EXISTS idx_activity_project_date ON activity_log(project_id, date_of_activity);
    `);
    console.log('✓ Created activity_log table');

    // ==================== AUDIT TRAIL ====================

    // Audit Trail
    await query(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entry_type VARCHAR(50) NOT NULL,
        entry_id UUID NOT NULL,
        changed_by UUID NOT NULL REFERENCES users(user_id),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        field_changed VARCHAR(100),
        original_value TEXT,
        new_value TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_audit_entry ON audit_trail(entry_type, entry_id);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_trail(changed_by);
    `);
    console.log('✓ Created audit_trail table');

    // ==================== FIWP INTEGRATION (FUTURE) ====================

    // Execution Phases
    await query(`
      CREATE TABLE IF NOT EXISTS execution_phases (
        phase_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        phase_name VARCHAR(255) NOT NULL,
        phase_number SMALLINT,
        predecessor_phase_id UUID REFERENCES execution_phases(phase_id),
        planned_start DATE,
        planned_finish DATE,
        budget_hours DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, phase_name)
      );
      CREATE INDEX IF NOT EXISTS idx_execution_phases_project ON execution_phases(project_id);
    `);
    console.log('✓ Created execution_phases table');

    // FIWP Register
    await query(`
      CREATE TABLE IF NOT EXISTS fiwp_register (
        fiwp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        fiwp_number VARCHAR(50),
        scope_description TEXT,
        phase_id UUID REFERENCES execution_phases(phase_id),
        cost_code_id VARCHAR(50) REFERENCES master_cost_codes(cost_code_id),
        planned_hours DECIMAL(10, 2),
        actual_hours DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'PRE_PLANNED',
        percent_complete DECIMAL(5, 2) DEFAULT 0,
        lead_hand_id UUID REFERENCES employees(employee_id),
        predecessor_fiwp_id UUID REFERENCES fiwp_register(fiwp_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_fiwp_project ON fiwp_register(project_id);
      CREATE INDEX IF NOT EXISTS idx_fiwp_status ON fiwp_register(status);
    `);
    console.log('✓ Created fiwp_register table');

    // Cost Code FIWP Mapping
    await query(`
      CREATE TABLE IF NOT EXISTS cost_code_fiwp_mapping (
        mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
        cost_code_id VARCHAR(50) NOT NULL REFERENCES master_cost_codes(cost_code_id),
        fiwp_id UUID NOT NULL REFERENCES fiwp_register(fiwp_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, cost_code_id, fiwp_id)
      );
      CREATE INDEX IF NOT EXISTS idx_cc_fiwp_project ON cost_code_fiwp_mapping(project_id);
    `);
    console.log('✓ Created cost_code_fiwp_mapping table');

    console.log(`
╔════════════════════════════════════════╗
║   Database Migration Complete!        ║
║   All 26 tables created successfully  ║
╚════════════════════════════════════════╝
    `);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().then(() => {
    console.log('Migration script finished');
    process.exit(0);
  });
}

export default runMigration;

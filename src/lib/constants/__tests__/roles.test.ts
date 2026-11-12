import { describe, it, expect } from 'vitest';
import {
  LEADER_ROLES,
  findLeaderInPersonnel,
  getLeaderRoleKey,
  autoFillGuardLeaders,
  getReportingPersonnelOptions,
  getFirstReportingPerson,
} from '../roles';
import type { StaffMember, StaffRole } from '@/lib/types';

describe('Roles leader autofill utilities', () => {
  const mockPersonnel: StaffMember[] = [
    {
      id: 'p1',
      workspace_id: 'ws1',
      name: 'Carlos Mendoza',
      rank: 'Inspector',
      cedula: 'V-11223344',
      cargo: 'Director',
      role_id: 'Director',
      status: 'activo',
    },
    {
      id: 'p2',
      workspace_id: 'ws1',
      name: 'María Fernández',
      rank: 'Sub-Inspector',
      cedula: 'V-22334455',
      cargo: 'Jefe de Operaciones',
      role_id: 'Jefe de Operaciones',
      status: 'activo',
    },
    {
      id: 'p3',
      workspace_id: 'ws1',
      name: 'Luis Gómez',
      rank: 'Oficial',
      cedula: 'V-33445566',
      cargo: 'Conductor',
      role_id: 'Conductor',
      status: 'activo',
    },
    {
      id: 'p4_inactive_director',
      workspace_id: 'ws1',
      name: 'Ex Director Antiguo',
      cargo: 'Director',
      role_id: 'Director',
      status: 'inactivo' as any,
    },
  ];

  const mockRoles: StaffRole[] = [
    { name: 'Director', is_single: true, department_scope: [], order: 0 },
    { name: 'Jefe de Operaciones', is_single: true, department_scope: [], order: 1 },
    { name: 'Operador de radio', is_single: false, department_scope: [], order: 2 },
  ];

  it('should find active Director in personnel', () => {
    const director = findLeaderInPersonnel(mockPersonnel, 'Director');
    expect(director).toBeDefined();
    expect(director?.name).toBe('Carlos Mendoza');
    expect(director?.id).toBe('p1');
  });

  it('should find active Jefe de Operaciones in personnel', () => {
    const jefeOps = findLeaderInPersonnel(mockPersonnel, 'Jefe de Operaciones');
    expect(jefeOps).toBeDefined();
    expect(jefeOps?.name).toBe('María Fernández');
    expect(jefeOps?.id).toBe('p2');
  });

  it('should match case-insensitively and handle variations like Directora', () => {
    const customPersonnel: StaffMember[] = [
      {
        id: 'p_directora',
        workspace_id: 'ws1',
        name: 'Ana Pérez',
        cargo: 'Directora',
        status: 'activo',
      },
    ];
    const found = findLeaderInPersonnel(customPersonnel, 'Director');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Ana Pérez');
  });

  it('should auto-fill empty staff with Director and Jefe de Operaciones', () => {
    const { updatedStaff, changed } = autoFillGuardLeaders({}, mockPersonnel, mockRoles);
    expect(changed).toBe(true);
    expect(updatedStaff['Director']).toHaveLength(1);
    expect(updatedStaff['Director'][0].name).toBe('Carlos Mendoza');
    expect(updatedStaff['Jefe de Operaciones']).toHaveLength(1);
    expect(updatedStaff['Jefe de Operaciones'][0].name).toBe('María Fernández');
  });

  it('should NOT overwrite existing Director or Jefe de Operaciones if already assigned', () => {
    const customLeader: StaffMember = {
      id: 'custom_dir',
      workspace_id: 'ws1',
      name: 'Director Asignado Manualmente',
    };
    const existingStaff = {
      Director: [customLeader],
    };

    const { updatedStaff, changed } = autoFillGuardLeaders(existingStaff, mockPersonnel, mockRoles);
    expect(changed).toBe(true); // Jefe de Operaciones was added
    expect(updatedStaff['Director'][0].name).toBe('Director Asignado Manualmente');
    expect(updatedStaff['Jefe de Operaciones'][0].name).toBe('María Fernández');
  });

  it('should return changed=false if both leaders are already present', () => {
    const existingStaff = {
      Director: [mockPersonnel[0]],
      'Jefe de Operaciones': [mockPersonnel[1]],
    };
    const { updatedStaff, changed } = autoFillGuardLeaders(existingStaff, mockPersonnel, mockRoles);
    expect(changed).toBe(false);
    expect(updatedStaff).toEqual(existingStaff);
  });
});

describe('Reporta ({Reporta}) automatic selection utilities', () => {
  const analista: StaffMember = {
    id: 'p_analista',
    workspace_id: 'ws1',
    name: 'Rubén Rojas',
    rank: 'OPC I',
    cedula: 'V-28.702.026',
    cargo: 'Analista de Sala de Monitoreo',
    role_id: 'Analista de Sala de Monitoreo',
    status: 'activo',
  };

  const operador: StaffMember = {
    id: 'p_operador',
    workspace_id: 'ws1',
    name: 'Francisco Marchan',
    rank: 'OPC',
    cedula: 'V-32.477.339',
    cargo: 'Operador de radio',
    role_id: 'Operador de radio',
    status: 'activo',
  };

  const jefeServicios: StaffMember = {
    id: 'p_servicios',
    workspace_id: 'ws1',
    name: 'Manuel Hurtado',
    rank: 'OSPC II',
    cedula: 'V-19.876.543',
    cargo: 'Jefe de los Servicios',
    role_id: 'Jefe de los Servicios',
    status: 'activo',
  };

  const director: StaffMember = {
    id: 'p_director',
    workspace_id: 'ws1',
    name: 'Gustavo Castillo',
    rank: 'Lcdo.',
    cargo: 'Director',
    role_id: 'Director',
    status: 'activo',
  };

  const mockStaff = {
    'Director': [director],
    'Jefe de los Servicios': [jefeServicios],
    'Analista de Sala de Monitoreo': [analista],
    'Operador de radio': [operador],
  };

  const mockAllRoles: StaffRole[] = [
    { name: 'Director', is_single: true, hierarchy_order: 0 },
    { name: 'Jefe de Operaciones', is_single: true, hierarchy_order: 1 },
    { name: 'Jefe de los Servicios', is_single: true, hierarchy_order: 2 },
    { name: 'Analista de Sala de Monitoreo', is_single: false, hierarchy_order: 8 },
    { name: 'Operador de radio', is_single: false, hierarchy_order: 11 },
  ];

  it('should select first person according to configured reportarole_ids priority', () => {
    // Priority: Operador first, then Analista
    const reportaroleIds = ['Operador de radio', 'Analista de Sala de Monitoreo'];
    const options = getReportingPersonnelOptions(mockStaff, reportaroleIds, mockAllRoles);
    expect(options).toHaveLength(2);
    expect(options[0].name).toBe('Francisco Marchan');
    expect(options[1].name).toBe('Rubén Rojas');

    const first = getFirstReportingPerson(mockStaff, reportaroleIds, mockAllRoles);
    expect(first?.name).toBe('Francisco Marchan');
    expect(first?.role_id).toBe('Operador de radio');
  });

  it('should auto-select Analista first when reportarole_ids is empty using default hierarchy', () => {
    const options = getReportingPersonnelOptions(mockStaff, [], mockAllRoles);
    expect(options.length).toBeGreaterThan(0);
    // Analista has default reporting priority
    expect(options[0].name).toBe('Rubén Rojas');

    const first = getFirstReportingPerson(mockStaff, [], mockAllRoles);
    expect(first?.name).toBe('Rubén Rojas');
  });

  it('should handle staff passed as an array of StaffMembers (from activeGuardStaff)', () => {
    const staffArray = [director, jefeServicios, analista, operador];
    const first = getFirstReportingPerson(staffArray, ['Analista de Sala de Monitoreo'], mockAllRoles);
    expect(first).toBeDefined();
    expect(first?.name).toBe('Rubén Rojas');
  });

  it('should fallback to personnelList when activeStaff is empty', () => {
    const personnel = [analista, operador, director];
    const first = getFirstReportingPerson({}, ['Analista de Sala de Monitoreo'], mockAllRoles, personnel);
    expect(first).toBeDefined();
    expect(first?.name).toBe('Rubén Rojas');
  });

  it('should exclude Director from reporting when other operational roles exist', () => {
    const onlyDirectorAndOperador = {
      'Director': [director],
      'Operador de radio': [operador],
    };
    const first = getFirstReportingPerson(onlyDirectorAndOperador, [], mockAllRoles);
    expect(first?.name).toBe('Francisco Marchan');
  });
});


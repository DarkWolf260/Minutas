export interface Report {
  id: string;
  title: string;
  date: string;
  summary: string;
  fullContent: string; // O la estructura que necesites para el contenido completo
}

export const mockReports: Report[] = [
  {
    id: "1",
    title: "Reporte Trimestral Q1",
    date: "2024-03-31",
    summary: "Resumen del primer trimestre del año.",
    fullContent: "Contenido completo del reporte Q1...",
  },
  {
    id: "2",
    title: "Análisis de Ventas Abril",
    date: "2024-04-30",
    summary: "Análisis detallado de las ventas del mes de abril.",
    fullContent: "Contenido completo del análisis de ventas de abril...",
  },
  {
    id: "3",
    title: "Informe de Progreso Proyecto X",
    date: "2024-05-15",
    summary: "Actualización sobre el progreso del Proyecto X.",
    fullContent: "Contenido completo del informe de progreso del Proyecto X...",
  },
];

export const getReports = async (): Promise<Report[]> => {
  // Simula una llamada a API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockReports);
    }, 500);
  });
};

export const getReportById = async (id: string): Promise<Report | undefined> => {
  // Simula una llamada a API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockReports.find((report) => report.id === id));
    }, 300);
  });
};

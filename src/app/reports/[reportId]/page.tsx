import ReportView from '@/components/reports/ReportView';
import { getReportById, getReports } from '@/lib/reportsData';
import Link from 'next/link'; // Asegurarse de que Link está importado

interface ReportPageParams {
  params: {
    reportId: string;
  };
}

// Esta función es necesaria para generar las rutas estáticas en tiempo de build
export async function generateStaticParams() {
  const reports = await getReports();
  return reports.map((report) => ({
    reportId: report.id,
  }));
}

const ReportDetailPage = async ({ params }: ReportPageParams) => {
  const report = await getReportById(params.reportId);

  // Podríamos tener un componente de "No encontrado" más elaborado
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Reporte no Encontrado</h1>
        <p className="text-gray-500">
          El reporte con ID &quot;{params.reportId}&quot; no pudo ser encontrado.
        </p>
        <Link href="/reports" className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Volver a la lista de reportes
        </Link>
      </div>
    );
  }

  return <ReportView report={report} />;
};

export default ReportDetailPage;

import { getReports } from '@/lib/reportsData'; // Report type is inferred
import ReportListItem from './ReportListItem';

const ReportsSidebar = async () => {
  const reports = await getReports();

  return (
    <aside className="w-80 bg-gray-100 p-4 overflow-y-auto border-r border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Reportes</h2>
      {reports.length > 0 ? (
        <ul>
          {reports.map((report) => (
            <ReportListItem key={report.id} report={report} />
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No hay reportes disponibles.</p>
      )}
    </aside>
  );
};

export default ReportsSidebar;

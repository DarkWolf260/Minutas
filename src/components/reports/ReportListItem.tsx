import Link from 'next/link';
import { Report } from '@/lib/reportsData';

interface ReportListItemProps {
  report: Report;
}

const ReportListItem: React.FC<ReportListItemProps> = ({ report }) => {
  return (
    <li className="mb-2">
      <Link
        href={`/reports/${report.id}`}
        className="block p-3 bg-white hover:bg-gray-50 rounded-md shadow transition-colors"
      >
        <h3 className="text-md font-semibold text-gray-700">{report.title}</h3>
        <p className="text-xs text-gray-500">{report.date}</p>
        <p className="text-sm text-gray-600 mt-1 truncate">{report.summary}</p>
      </Link>
    </li>
  );
};

export default ReportListItem;

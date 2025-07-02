import ReportsSidebar from '@/components/reports/ReportsSidebar';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <ReportsSidebar />
      <div className="flex-1 p-6 bg-white shadow-lg rounded-r-lg overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

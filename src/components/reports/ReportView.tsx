import { Report } from '@/lib/reportsData';

interface ReportViewProps {
  report: Report | undefined;
}

const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  if (!report) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-gray-600">Reporte no encontrado</h2>
        <p className="text-gray-500">El reporte que buscas no existe o no pudo ser cargado.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{report.title}</h1>
      <p className="text-sm text-gray-500 mb-6">Fecha: {report.date}</p>

      <div className="prose max-w-none">
        {/* La clase 'prose' de Tailwind ayuda a dar estilo al contenido HTML */}
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Resumen</h2>
        <p className="mb-6">{report.summary}</p>

        <h2 className="text-xl font-semibold text-gray-700 mb-3">Contenido Completo</h2>
        {/* Aquí podrías tener un renderizado más complejo si fullContent es HTML o Markdown */}
        <p>{report.fullContent}</p>
      </div>
    </div>
  );
};

export default ReportView;

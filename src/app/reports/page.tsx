const ReportsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-semibold text-gray-700 mb-4">
        Selecciona un Reporte
      </h1>
      <p className="text-gray-500">
        Elige un reporte de la lista en la barra lateral para ver su contenido.
      </p>
      {/* Podrías añadir aquí un icono o una ilustración */}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-300 mt-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25.75H12m8.25 3v8.25a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18V6.75a2.25 2.25 0 012.25-2.25h4.5M10.5 2.25H6.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V9.75M10.5 2.25h1.875c.621 0 1.125.504 1.125 1.125v1.875c0 .621-.504 1.125-1.125 1.125H10.5V2.25z" />
      </svg>

    </div>
  );
};

export default ReportsPage;

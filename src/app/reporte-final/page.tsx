
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useReports } from '@/hooks/use-reports';
import { Skeleton } from '@/components/ui/skeleton';
import { sortReports } from '@/lib/report-sorter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFieldDefinitions } from '@/hooks/use-field-definitions';

export default function ReporteFinalPage() {
    const { reports, isLoaded: reportsLoaded } = useReports();
    const { definitions, isLoaded: definitionsLoaded } = useFieldDefinitions();
    
    const [finalRemarks, setFinalRemarks] = useState('');
    const [generatedReport, setGeneratedReport] = useState('');
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    const [copyButtonText, setCopyButtonText] = useState('Copiar');

    const globalSettings = useMemo(() => {
        const settings: Record<string, string> = {};
        Object.entries(definitions).forEach(([key, config]) => {
            if (config.type === 'predefined') {
                settings[key] = config.value || '';
            }
        });
        return settings;
    }, [definitions]);

    const sortedReports = useMemo(() => {
        return sortReports(reports, 'asc');
    }, [reports]);

    const handleGenerateReport = () => {
        if (!reports.length) {
            setGeneratedReport('No hay novedades para reportar.');
            setIsResultDialogOpen(true);
            return;
        }

        const today = new Date();
        const fecha = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const hora = today.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

        const reportContent = sortedReports.map(report => report.content).join('\n\n----------------------------------------\n\n');

        const reportParts = [
            `*CIERRE DE GUARDIA*`,
            `*PROTECCIÓN CIVIL MUNICIPIO ${(globalSettings['Municipio'] || '').toUpperCase()}*`,
            `*FECHA:* ${fecha} - *HORA:* ${hora}`,
            `----------------------------------------`,
            ``,
            `*NOVEDADES DEL DÍA:*`,
            ``,
            reportContent,
            ``,
            `----------------------------------------`,
            `*OBSERVACIONES FINALES:*`,
            finalRemarks || 'Sin observaciones.',
            ``,
            `*REPORTE CERRADO POR:*`,
            `${globalSettings['Jefe de Operaciones'] || ''}`,
            ``,
            `*SISTEMA NACIONAL DE GESTIÓN DE RIESGOS*`
        ];
        
        const finalReportText = reportParts.join('\n').trim();
        setGeneratedReport(finalReportText);
        setIsResultDialogOpen(true);
        setCopyButtonText('Copiar');
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(generatedReport);
        setCopyButtonText('¡Copiado!');
        setTimeout(() => setCopyButtonText('Copiar'), 2000);
    };

    const isLoaded = reportsLoaded && definitionsLoaded;

    return (
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <Card className="max-w-4xl mx-auto shadow-lg">
                    <CardHeader>
                        <CardTitle>Generador de Reporte de Cierre de Guardia</CardTitle>
                        <CardDescription>
                            Recopila todas las novedades del día en orden cronológico para generar el reporte final.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!isLoaded ? (
                            <div className="space-y-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-48 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold mb-2">Novedades a Incluir ({sortedReports.length})</h4>
                                    <ScrollArea className="h-48 rounded-md border p-4 bg-muted/50">
                                        {sortedReports.length > 0 ? (
                                            <ul className="space-y-2">
                                                {sortedReports.map(report => (
                                                    <li key={report.id} className="text-sm">
                                                        - {report.title}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center">No hay novedades para mostrar.</p>
                                        )}
                                    </ScrollArea>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="final-remarks">Observaciones Finales (Opcional)</Label>
                                    <Textarea 
                                        id="final-remarks" 
                                        value={finalRemarks}
                                        onChange={(e) => setFinalRemarks(e.target.value)}
                                        placeholder="Añade aquí cualquier observación o conclusión para el cierre de la guardia..."
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleGenerateReport} disabled={reports.length === 0}>Generar Reporte de Cierre</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Reporte de Cierre de Guardia Generado</DialogTitle>
                        <DialogDescription>
                            Puedes copiar el texto generado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            readOnly
                            value={generatedReport}
                            className="h-80 text-sm whitespace-pre-wrap font-mono"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleCopyToClipboard}>
                            {copyButtonText}
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cerrar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

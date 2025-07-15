
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookUser, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function DocumentationHubPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight">Centro de Documentación</h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Explora las guías y la documentación técnica de la aplicación.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 text-primary p-3 rounded-full">
                                    <BookUser className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>Guía de Usuario</CardTitle>
                                    <CardDescription>Aprende a usar la aplicación, desde la gestión de datos hasta la lógica de reportes.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Una guía detallada sobre cómo funcionan el guardado de datos y el renderizado de reportes. Ideal para entender la lógica de la aplicación.
                            </p>
                            <Button asChild>
                                <Link href="/documentation/user-guide">
                                    Ir a la Guía de Usuario <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                 <div className="bg-accent/10 text-accent-foreground p-3 rounded-full">
                                    <Wrench className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle>Documentación del Motor de Plantillas</CardTitle>
                                    <CardDescription>Una inmersión profunda en el código que impulsa la creación de reportes.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground mb-4">
                                Explicación técnica del archivo `template-parser.ts`, sus funciones, métodos y la lógica de análisis y renderizado.
                            </p>
                            <Button asChild variant="secondary">
                                <Link href="/documentation/template-engine">
                                    Ver Documentación Técnica <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

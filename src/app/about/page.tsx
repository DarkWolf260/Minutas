
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mountain } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AboutPage() {
  const appVersion = "1.0.0";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <Mountain className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl">Generador de Reportes</CardTitle>
          <CardDescription>Versión {appVersion}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6 text-center">
          <div className="text-muted-foreground space-y-4 leading-relaxed">
            <p>
              Esta aplicación fue diseñada y desarrollada con el objetivo de simplificar y agilizar
              la creación de reportes operativos. La meta es proporcionar una herramienta robusta,
              flexible y fácil de usar que se adapte a las necesidades del trabajo diario.
            </p>
            <p>
              Toda la información que ingresas se almacena de forma segura y privada en tu
              propio navegador, garantizando que tus datos permanezcan bajo tu control.
            </p>
            <p className="font-semibold text-card-foreground">
              ¡Gracias por usar la aplicación y por tu valioso feedback para seguir mejorando!
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-card-foreground">Unas palabras del desarrollador:</h3>
            <blockquote className="border-l-4 pl-4 italic text-muted-foreground text-left">
              <p>
                "Esta aplicación fue hecha con la flojera que me daba seguir editando en Word las minutas, un esclavo de IA y bastante paciencia para explicarle al esclavo toda la lógica que me saqué del forro para que funcione esta aplicación en un lenguaje en el que ni me molesté en revisar su sintaxis. Todo esto usando el tiempo en el que debí estar haciendo mi tesis. Gracias Git, por permitirme volver atrás cada que rompía el código"
              </p>
            </blockquote>
             <p className="text-sm italic text-muted-foreground text-center pt-2">
              PD: "Ahora tengo que ver como convierto esta vaina en una PWA"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

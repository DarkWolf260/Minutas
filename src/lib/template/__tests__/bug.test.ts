import { parseTemplate, renderFinalReport } from '../../template-parser';
import { test } from 'vitest';

test('missing bracket bug', () => {
    const template = `["Descripción de los hechos"- *DESCRIPCIÓN DE LA NOVEDAD:* {Descripción de la novedad:textarea:def=(Se apersona a la institución ciudadano solicitando atención prehospitalaria para su persona ya que refiere encontranse en regulares condiciones de salud, el personal técnico procede a realizar dicha atención arrojando el diagnostico mencionado, cabe destacar que no amerito traslado.)
    
[singular="DATOS DEL PACIENTE" plural="DATOS DE LOS PACIENTE" sub="PACIENTE"
- *NOMBRE Y APELLIDO:* {Nombre y apellido:title:req}
- *CÉDULA:* {Cédula:req}
- *EDAD:* {Edad:req}
- *IDX:* {IDX:req}
- *DIRECCIÓN:* {Dirección}]

- *PERSONAL QUE REALIZA LA ATENCIÓN:*
- *TECNICO:* {Técnico:req}

[""]- *REPORTA:* {Reporta}`;

    const parsed = parseTemplate(template);
    console.log("--- PARSED SECTIONS ---");
    console.log(JSON.stringify(parsed.sections, null, 2));

    const report = renderFinalReport(template, {
        "Descripción de la novedad": "Test",
        "Nombre y apellido": ["Juan Perez"],
        "Cédula": ["12345678"],
        "Edad": ["30"],
        "IDX": ["Test"],
        "Dirección": ["Test"],
        "Técnico": "Perez",
        "Reporta": "Juan"
    }, { fields: {}, sections: parsed.sections, layout: parsed.layout }, {});
    const fs = require('fs');
    fs.writeFileSync('report.json', JSON.stringify(report));
    fs.writeFileSync('ast.json', JSON.stringify(parsed.sections, null, 2));
    console.log("Wrote report.json and ast.json");
});



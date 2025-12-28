// Test script for semantic validation in template parser
import { readFileSync } from 'fs';
import { join } from 'path';

// Simple mock of the parser function for testing
// We'll read the actual implementation
const testCases = [
    {
        name: 'Test 1: Campo inexistente en condicional',
        file: 'test-semantic-error-1.txt',
        expectedErrors: ['TipoIncidenteIncorrecto', 'no está definido']
    },
    {
        name: 'Test 2: Índice fuera de rango',
        file: 'test-semantic-error-2.txt',
        expectedErrors: ['índice 5', 'solo tiene 2 opciones']
    },
    {
        name: 'Test 3: Condicional en campo no-dropdown',
        file: 'test-semantic-error-3.txt',
        expectedErrors: ['no es un dropdown', 'condicionales solo funcionan']
    },
    {
        name: 'Test 4: Plantilla válida (control)',
        file: 'test-semantic-valid.txt',
        expectedErrors: []
    }
];

async function runTests() {
    console.log('🧪 Iniciando pruebas de validación semántica...\n');

    // Dynamic import of the parser
    const { parseTemplate } = await import('./src/lib/template-parser.js');

    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of testCases) {
        console.log(`\n📝 ${testCase.name}`);
        console.log(`   Archivo: ${testCase.file}`);

        try {
            const content = readFileSync(join(process.cwd(), testCase.file), 'utf-8');
            const result = parseTemplate(content);

            console.log(`   Errores detectados: ${result.errors.length}`);

            if (result.errors.length > 0) {
                console.log('   Mensajes:');
                result.errors.forEach((err, i) => {
                    console.log(`     ${i + 1}. ${err}`);
                });
            }

            // Validate expectations
            let testPassed = true;

            if (testCase.expectedErrors.length === 0) {
                // Should have no errors
                if (result.errors.length > 0) {
                    console.log('   ❌ FALLÓ: Se esperaban 0 errores');
                    testPassed = false;
                }
            } else {
                // Should have errors containing expected keywords
                const allErrors = result.errors.join(' ');
                for (const expectedKeyword of testCase.expectedErrors) {
                    if (!allErrors.includes(expectedKeyword)) {
                        console.log(`   ❌ FALLÓ: No se encontró palabra clave "${expectedKeyword}"`);
                        testPassed = false;
                    }
                }
            }

            if (testPassed) {
                console.log('   ✅ PASÓ');
                passedTests++;
            } else {
                failedTests++;
            }

        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            failedTests++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Resultados: ${passedTests}/${testCases.length} pruebas pasaron`);

    if (failedTests === 0) {
        console.log('✅ Todas las validaciones funcionan correctamente!\n');
        process.exit(0);
    } else {
        console.log(`❌ ${failedTests} pruebas fallaron\n`);
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Error ejecutando pruebas:', err);
    process.exit(1);
});

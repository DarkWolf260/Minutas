
/**
 * Utilidades para validación de datos y estados de la aplicación.
 */

/**
 * Verifica si hay espacio suficiente en localStorage.
 * @returns true si hay espacio, false si está casi lleno o hubo error.
 */
export function checkLocalStorageSpace(): boolean {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Valida si una cadena es un JSON válido.
 */
export function isValidJson(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Valida la sintaxis básica de una plantilla.
 * Verifica que los bloques abiertos estén cerrados.
 */
export function validateTemplateSyntax(content: string): { valid: boolean; error?: string } {
    // Conteo de llaves para campos {}
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
        return {
            valid: false,
            error: 'Llaves de campos { } no están balanceadas.'
        };
    }

    // Conteo de corchetes para secciones []
    // Nota: Esto es simplificado ya que [] puede ser anidado
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;

    if (openBrackets !== closeBrackets) {
        return {
            valid: false,
            error: 'Corchetes de secciones [ ] no están balanceados.'
        };
    }

    // Verificar secciones condicionales [?{...}=n] ... [/]
    const openCond = (content.match(/\[\?\{/g) || []).length;
    const closeCond = (content.match(/\[\/\s*\]/g) || []).length;

    if (openCond !== closeCond) {
        return {
            valid: false,
            error: 'Secciones condicionales [?{...}] no están cerradas correctamente con [/].'
        };
    }

    return { valid: true };
}

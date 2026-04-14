# Guía de Rendimiento y Unificación de Interfaces (RxDB + DnD)

Esta guía establece los estándares para el desarrollo de interfaces interactivas en el proyecto Minutas, enfocándose en eliminar el parpadeo (flickering) y asegurar actualizaciones optimistas fluidas.

## 1. El Problema: Rebote de Estado (Flickering)

Al trabajar con bases de datos reactivas como RxDB, ocurre el siguiente ciclo:
1. El usuario realiza una acción (ej. arrastrar un cargo).
2. Se llama a la función de guardado en la base de datos.
3. RxDB procesa el cambio y emite el nuevo estado.
4. El componente se re-renderiza con el nuevo estado.

**El parpadeo ocurre** en el milisegundo entre el paso 1 y el paso 4, donde la interfaz intenta volver al estado anterior porque las `props` aún no han cambiado.

## 2. Solución: Estado Local Optimista

Para interfaces de arrastrar y soltar (DnD), cada componente gestor debe mantener un **estado local** que se sincronice con las props.

```tsx
// Ejemplo de patrón unificado
function MyComponent({ items, onReorder }) {
  // 1. Mantener estado local sincronizado con props
  const [localItems, setLocalItems] = useState(items);
  
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // 2. Actualizar localmente de forma instantánea
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const newItems = arrayMove(localItems, oldIdx, newIdx);
      setLocalItems(newItems); // Actualización instantánea (sin parpadeo)
      onReorder(newItems);    // Persistencia en segundo plano
    }
  };
  
  // 3. Renderizar siempre desde el estado local
  return <SortableContext items={localItems}>...</SortableContext>;
}
```

## 3. Prevención de Re-renderizados Causales

Incluso con estados optimistas, si los componentes de la lista son pesados, la interfaz puede sentirse lenta.

### Memoización Obligatoria
Todos los componentes que representan elementos de una lista (filas, badges, items de menú) deben estar envueltos en `React.memo`.

```tsx
const ListItem = React.memo(({ data, onDelete }) => {
  return <div>{data.name}</div>;
});
```

### Funciones Estables (useCallback)
Nunca pases funciones anónimas o funciones que se recrean en cada render a componentes memoizados.

```tsx
// MAL (Provoca re-render de todos los hijos)
<ListItem onDelete={() => handleDelete(id)} />

// BIEN (Mantiene la referencia estable)
const handleDelete = useCallback((id) => { ... }, [deps]);
<ListItem id={id} onDelete={handleDelete} />
```

## 4. Check-list para Nuevas Interfaces

- [ ] ¿El componente usa un estado local para las actualizaciones optimistas?
- [ ] ¿Los elementos de la lista están envueltos en `React.memo`?
- [ ] ¿Todos los manejadores (`callbacks`) son estables mediante `useCallback`?
- [ ] ¿Las `keys` utilizadas son estables e idénticas a los IDs usados por el sensor de DnD?
- [ ] ¿Se han evitado transiciones CSS agresivas en propiedades que afectan el Layout (como `height` o `margin`) durante el arrastre?

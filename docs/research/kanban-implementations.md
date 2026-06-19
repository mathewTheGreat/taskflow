# Kanban Board Implementations (Phase 2 Research)

## Problem
Need a drag-and-drop Kanban board for task management. This is Phase 2 but good to research early.

## Options

### 1. @hello-pangea/dnd (Recommended)
- Fork of react-beautiful-dnd (which is archived)
- Works with React 18+
- Smooth animations, accessible
- API: `<Droppable>` + `<Draggable>` components
- ~30kb gzipped

```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="board">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {columns.map((col, i) => (
          <Draggable key={col.id} draggableId={col.id} index={i}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.draggableProps}>
                <div {...provided.dragHandleProps}>{col.title}</div>
                {col.tasks.map((task, j) => (
                  <Draggable key={task.id} draggableId={task.id} index={j}>
                    ...
                  </Draggable>
                ))}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
```

### 2. dnd-kit
- Modern, lightweight, highly customizable
- Modular: only import what you need
- ~10kb gzipped
- Better for complex nested drag scenarios
- Uses sensors (pointer, keyboard, touch)

### 3. react-dnd
- HTML5 drag-and-drop backend
- More manual control, steeper learning curve
- Good for file drag-and-drop too

## Recommendation
Use **@hello-pangea/dnd** for Phase 2 — it's the most straightforward for a standard Kanban board and has the best community examples.

## State Management
- On drag end: optimistically update local state → call API to persist new status/order
- On API failure: rollback to previous state, show error toast

## References
- [hello-pangea/dnd examples](https://github.com/hello-pangea/dnd/tree/main/stories)
- [dnd-kit Kanban example](https://docs.dndkit.com/presets/sortable#kanban-board)
- [Trello clone tutorial](https://www.youtube.com/watch?v=ijmb5r4tVyw)

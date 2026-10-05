'use client';

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ScreenshotNode } from './ScreenshotNode';
import { ScreenshotItem } from '@/types/journal';
import { CanvasTheme } from '@/lib/themes';
import { Compass, BookOpen } from 'lucide-react';

interface JournalCanvasProps {
  items: ScreenshotItem[];
  onDeleteNode: (id: string) => void;
  onPreviewNode: (item: ScreenshotItem) => void;
  onEditNode: (item: ScreenshotItem) => void;
  searchQuery: string;
  selectedCategory: string;
  theme: CanvasTheme;
}

export function JournalCanvas({
  items,
  onDeleteNode,
  onPreviewNode,
  onEditNode,
  searchQuery,
  selectedCategory,
  theme,
}: JournalCanvasProps) {
  const nodeTypes = useMemo(() => ({ screenshotNode: ScreenshotNode }), []);

  const initialNodes: Node[] = useMemo(() => {
    // Group items by category for stacked layout
    const categoryGroups = items.reduce((acc, item) => {
      const cat = item.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, ScreenshotItem[]>);

    // Calculate positions with category stacking (20px gap between categories)
    let yOffset = 60;
    const categoryPositions: Record<string, { startY: number }> = {};
    
    Object.keys(categoryGroups).sort().forEach((category) => {
      categoryPositions[category] = { startY: yOffset };
      const itemsInCategory = categoryGroups[category].length;
      yOffset += Math.ceil(itemsInCategory / 3) * 320 + 20; // 20px gap between categories
    });

    return items.map((item, index) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();

      const isVisible = matchesSearch && matchesCategory;

      // Use existing position if available, otherwise calculate based on category
      let position = item.position;
      if (!position) {
        const category = item.category || 'Uncategorized';
        const categoryStartY = categoryPositions[category]?.startY || 60;
        const categoryItems = categoryGroups[category];
        const itemIndexInCategory = categoryItems.findIndex((i) => i.id === item.id);
        
        position = {
          x: (itemIndexInCategory % 3) * 220 + 60,
          y: categoryStartY + Math.floor(itemIndexInCategory / 3) * 320,
        };
      }

      return {
        id: item.id,
        type: 'screenshotNode',
        position,
        data: {
          ...item,
          onDelete: onDeleteNode,
          onPreview: onPreviewNode,
          onEdit: onEditNode,
          theme,
        },
        className: isVisible
          ? 'opacity-100 transition-opacity'
          : 'opacity-15 pointer-events-none transition-opacity',
      };
    });
  }, [items, searchQuery, selectedCategory, onDeleteNode, onPreviewNode, onEditNode, theme]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: {
              stroke: theme.isDark ? theme.accentText : '#736350',
              strokeWidth: 2,
              strokeDasharray: '4 4',
            },
          },
          eds
        )
      ),
    [setEdges, theme]
  );

  return (
    <div
      className="w-full h-[100dvh] transition-colors duration-500"
      style={{ background: theme.canvasBg }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={3}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        style={{ background: theme.canvasBg }}
        panOnDrag={[1, 2]}
        zoomOnPinch
        zoomOnDoubleClick
      >
        {/* Graph paper grid — colour driven by active theme */}
        <Background
          variant={BackgroundVariant.Lines}
          gap={24}
          color={theme.gridColor}
          lineWidth={1}
        />

        {/* Zoom controls — hidden on mobile */}
        <Controls
          showFitView
          showInteractive
          className="!hidden md:!flex !rounded-lg !shadow-md overflow-hidden"
          style={{
            backgroundColor: theme.sidebarBg,
            borderColor: theme.sidebarBorder,
          }}
        />

        {/* MiniMap — desktop only */}
        <MiniMap
          nodeStrokeWidth={2}
          zoomable
          pannable
          className="!hidden md:!block !rounded-lg !shadow-md !overflow-hidden"
          style={{
            backgroundColor: theme.sidebarBg,
            borderColor: theme.sidebarBorder,
          }}
          maskColor={theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(250, 247, 240, 0.75)'}
          nodeColor={(node) => {
            const cat = (node.data as unknown as ScreenshotItem)?.category;
            if (cat === 'Recipes') return '#b45309';
            if (cat === 'Places') return '#047857';
            if (cat === 'Design') return '#6d28d9';
            if (cat === 'Receipts') return '#57534e';
            return theme.isDark ? '#8aa4c0' : '#8c7e6b';
          }}
        />

        {/* Canvas hint — desktop only */}
        <Panel position="bottom-left" className="mb-20 md:mb-4 mx-4">
          <div
            className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg text-[11px] font-serif shadow-sm border transition-colors duration-500"
            style={{
              backgroundColor: theme.sidebarBg + 'ee',
              borderColor: theme.sidebarBorder,
              color: theme.textSecondary,
            }}
          >
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: theme.textPrimary }}>
              <Compass className="w-3.5 h-3.5" style={{ color: theme.textFaint }} />
              Paperback Canvas
            </span>
            <span style={{ color: theme.sidebarBorder }}>•</span>
            <span>Drag polaroids · Connect · Scroll to zoom</span>
          </div>
        </Panel>

        {/* Empty state */}
        {items.length === 0 && (
          <Panel position="top-center" className="mt-20 md:mt-28 pointer-events-none">
            <div
              className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl text-center max-w-xs shadow-md mx-4 border backdrop-blur-sm transition-colors duration-500"
              style={{
                backgroundColor: theme.sidebarBg + 'f5',
                borderColor: theme.sidebarBorder,
              }}
            >
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 shadow-inner"
                style={{ backgroundColor: theme.accentBg, color: theme.textSecondary }}
              >
                <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="font-serif font-bold text-sm md:text-base" style={{ color: theme.textPrimary }}>
                Your Journal is Empty
              </h3>
              <p className="text-xs font-serif mt-1.5 leading-relaxed" style={{ color: theme.textSecondary }}>
                <span className="md:hidden">Tap the <strong>+</strong> button below to add your first photo.</span>
                <span className="hidden md:inline">Drop a screenshot in the sidebar or click <strong>Add Sample</strong>.</span>
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

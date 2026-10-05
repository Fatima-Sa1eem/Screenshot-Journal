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
  searchQuery: string;
  selectedCategory: string;
  theme: CanvasTheme;
}

export function JournalCanvas({
  items,
  onDeleteNode,
  onPreviewNode,
  searchQuery,
  selectedCategory,
  theme,
}: JournalCanvasProps) {
  const nodeTypes = useMemo(() => ({ screenshotNode: ScreenshotNode }), []);

  const initialNodes: Node[] = useMemo(() => {
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

      return {
        id: item.id,
        type: 'screenshotNode',
        position: item.position || {
          x: (index % 3) * 220 + 60,
          y: Math.floor(index / 3) * 320 + 60,
        },
        data: {
          ...item,
          onDelete: onDeleteNode,
          onPreview: onPreviewNode,
          theme,
        },
        className: isVisible
          ? 'opacity-100 transition-opacity'
          : 'opacity-15 pointer-events-none transition-opacity',
      };
    });
  }, [items, searchQuery, selectedCategory, onDeleteNode, onPreviewNode, theme]);

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

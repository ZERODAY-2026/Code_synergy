import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const COLOR_MAP = {
  ip: '#22D3EE',
  user: '#35D07F',
  domain: '#8B7CF6',
  host: '#8B7CF6',
  alert: '#FF5C5C',
  finding: '#F5A524',
};

function GraphScene({ nodes, edges, onHoverNode }) {
  const groupRef = useRef();

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  // Build edge line segments
  const lineGeometry = useMemo(() => {
    const points = [];
    for (const [sourceId, targetId] of edges) {
      const s = nodes.find((n) => n.id === sourceId);
      const t = nodes.find((n) => n.id === targetId);
      if (s && t) {
        points.push(new THREE.Vector3(...s.pos));
        points.push(new THREE.Vector3(...t.pos));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [nodes, edges]);

  return (
    <group ref={groupRef}>
      {/* Edges */}
      {lineGeometry && (
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial color="#7C8798" transparent opacity={0.3} />
        </lineSegments>
      )}

      {/* Nodes */}
      {nodes.map((node) => (
        <mesh
          key={node.id}
          position={node.pos}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverNode(node);
          }}
          onPointerOut={() => onHoverNode(null)}
        >
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.65}
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 3D Entity Graph Canvas
 * Force-ish layout of IPs, Users, and Findings with blast radius spatial relationships.
 */
export default function EntityGraph({ iocs = [], findings = [], flat }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // Derive graph nodes and edges from IOCs and Findings
  const { nodes, edges } = useMemo(() => {
    const nodeList = [];
    const edgeList = [];
    const entityMap = new Map();

    // Add IOC nodes
    (iocs || []).forEach((ioc, idx) => {
      const key = `${ioc.type}:${ioc.value}`;
      if (!entityMap.has(key)) {
        entityMap.set(key, {
          id: key,
          label: ioc.value,
          type: ioc.type || 'ip',
          color: COLOR_MAP[ioc.type] || '#22D3EE',
          count: 1,
        });
      } else {
        entityMap.get(key).count += 1;
      }
    });

    // Add Finding nodes
    (findings || []).slice(0, 4).forEach((f) => {
      const key = `finding:${f.id}`;
      entityMap.set(key, {
        id: key,
        label: f.title,
        type: 'finding',
        color: f.severity === 'critical' ? '#FF5C5C' : '#F5A524',
        count: 2,
      });
    });

    // Fallback if empty
    if (entityMap.size === 0) {
      entityMap.set('host:web01', { id: 'host:web01', label: 'web01', type: 'host', color: '#8B7CF6', count: 3 });
      entityMap.set('user:deploy', { id: 'user:deploy', label: 'deploy', type: 'user', color: '#35D07F', count: 2 });
      entityMap.set('ip:203.0.113.44', { id: 'ip:203.0.113.44', label: '203.0.113.44', type: 'ip', color: '#22D3EE', count: 4 });
      entityMap.set('ip:198.51.100.7', { id: 'ip:198.51.100.7', label: '198.51.100.7', type: 'ip', color: '#22D3EE', count: 1 });
    }

    const items = Array.from(entityMap.values());
    const count = items.length;

    items.forEach((item, i) => {
      // Position around sphere with jitter
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 1.35;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      nodeList.push({
        ...item,
        pos: [x, y, z],
        size: Math.min(0.26, 0.12 + (item.count || 1) * 0.035),
      });

      // Connect to next node or center
      if (i > 0) {
        edgeList.push([items[i - 1].id, item.id]);
      }
    });

    if (items.length > 2) {
      edgeList.push([items[items.length - 1].id, items[0].id]);
    }

    return { nodes: nodeList, edges: edgeList };
  }, [iocs, findings]);

  if (flat) {
    return (
      <div className="w-[100px] h-[90px] rounded-lg p-2 flex flex-col justify-between border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,16,0.8)]">
        <span className="text-[9px] font-bold tracking-wider text-[color:var(--muted)] uppercase">Entity Map</span>
        <div className="flex flex-wrap gap-1">
          {nodes.slice(0, 4).map((n) => (
            <span
              key={n.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: n.color }}
              title={`${n.type}: ${n.label}`}
            />
          ))}
        </div>
        <span className="text-[8px] mono text-[color:var(--muted)]">{nodes.length} entities</span>
      </div>
    );
  }

  return (
    <div className="relative w-[110px] h-[95px] rounded-lg overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(10,12,16,0.65)] backdrop-blur-md group">
      <div className="absolute top-1 left-2 z-10 pointer-events-none text-[8px] font-bold tracking-wider uppercase text-[color:var(--muted)] opacity-70">
        Entity Graph
      </div>

      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <GraphScene nodes={nodes} edges={edges} onHoverNode={setHoveredNode} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotateSpeed={0.5} />
      </Canvas>

      {hoveredNode && (
        <div className="absolute bottom-1 inset-x-1 z-20 pointer-events-none rounded px-1.5 py-0.5 text-[8px] mono truncate bg-[rgba(0,0,0,0.85)] border border-[rgba(255,255,255,0.15)] text-center text-[color:var(--text)]">
          <span style={{ color: hoveredNode.color }}>●</span> {hoveredNode.label}
        </div>
      )}
    </div>
  );
}

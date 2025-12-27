import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ThreeMFLoader } from 'three-stdlib';
import * as THREE from 'three';

function CarModel() {
  const groupRef =  useRef();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const loader = new ThreeMFLoader();
    
    loader.load(
      '/car-model.3mf',
      (group) => {
        group.scale.set(0.8, 0.8, 0.8);
        group.rotation.y = Math.PI * 0.15;
        group.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: '#0B0C0E',
              metalness: 0.85,
              roughness: 0.25,
              envMapIntensity: 0.6,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setModel(group);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.warn('3MF model not found, using fallback');
        setLoading(false);
      }
    );
  }, []);

  useFrame((state) => {
    if (groupRef.current && model) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.PI * 0.15 + Math.sin(time * 0.15) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} />
      <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={0.4} color="#B1121A" />
      
      {model && <primitive object={model} />}
      {loading && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 3]} />
          <meshStandardMaterial color="#14161A" metalness={0.7} roughness={0.3} />
        </mesh>
      )}
    </group>
  );
}

function Car3D() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0B0C0E' }}>
      <Canvas 
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        gl={{ alpha: false, antialias: true }}
      >
        <color attach="background" args={['#0B0C0E']} />
        <fog attach="fog" args={['#0B0C0E', 5, 15]} />
        <CarModel />
      </Canvas>
    </div>
  );
}

export default Car3D;

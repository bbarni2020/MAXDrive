import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ThreeMFLoader, OrbitControls } from 'three-stdlib';
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
        // Center the model at origin and scale to fit view
        const bbox = new THREE.Box3().setFromObject(group);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        group.position.sub(center);

        const longest = Math.max(size.x, size.y, size.z) || 1;
        const target = 3.0; // target longest dimension in scene units
        const s = target / longest;
        group.scale.setScalar(s);

        group.traverse((child) => {
          if (child.isMesh && child.material) {
            if (child.material.map) {
              child.material.map.colorSpace = THREE.SRGBColorSpace;
            }
            if (child.material.emissiveMap) {
              child.material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            }
            if ('envMapIntensity' in child.material) {
              child.material.envMapIntensity = 0.6;
            }
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.needsUpdate = true;
          }
        });
        setModel(group);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.warn('3MF model load error:', error);
        setLoading(false);
      }
    );
  }, []);

  // Keep the group ref to position lights and model

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

function Controls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0.5, 0);
    controls.update();
    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => {
    controlsRef.current && controlsRef.current.update();
  });

  return null;
}

function Car3D() {
  return (
    <div 
      style={{ width: '100%', height: '100%', background: '#0B0C0E', position: 'relative' }}
    >
      <Canvas 
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        gl={{ alpha: false, antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <color attach="background" args={['#0B0C0E']} />
        <fog attach="fog" args={['#0B0C0E', 5, 15]} />
        <CarModel />
        <Controls />
      </Canvas>
    </div>
  );
}

export default Car3D;

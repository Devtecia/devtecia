"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"

export function ThreeBackground() {
  return (
    <Canvas camera={{ position: [0, 0, 1] }}>
      <color attach="background" args={["#050816"]} />
      <Stars />
      <FlyingParticles />
      <GradientBackground />
    </Canvas>
  )
}

function Stars({ count = 5000 }) {
  const points = useRef()

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return positions
  }, [count])

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.x -= delta * 0.01
      points.current.rotation.y -= delta * 0.01
    }
  })

  return (
    <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.1} sizeAttenuation={true} depthWrite={false} opacity={0.6} />
    </Points>
  )
}

function FlyingParticles({ count = 100 }) {
  const mesh = useRef()
  const { viewport } = useThree()

  // Generate particles
  const particles = useMemo(() => {
    if (!viewport) return []

    const temp = []
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 0.1 + 0.05
      const speed = Math.random() * 0.05 + 0.02
      const x = (Math.random() - 0.5) * (viewport.width || 10) * 2
      const y = (Math.random() - 0.5) * (viewport.height || 10) * 2
      const z = (Math.random() - 0.5) * 10
      temp.push({ size, speed, x, y, z })
    }
    return temp
  }, [count, viewport])

  // Create geometry
  const geometry = useMemo(() => {
    if (!particles || particles.length === 0) return null

    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      if (particles[i]) {
        positions[i * 3] = particles[i].x
        positions[i * 3 + 1] = particles[i].y
        positions[i * 3 + 2] = particles[i].z
        scales[i] = particles[i].size
      }
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("scale", new THREE.BufferAttribute(scales, 1))
    return geo
  }, [count, particles])

  // Animation
  useFrame((state, delta) => {
    if (!mesh.current || !mesh.current.geometry || !mesh.current.geometry.attributes.position || !viewport) return

    const positions = mesh.current.geometry.attributes.position.array

    for (let i = 0; i < count; i++) {
      if (particles[i]) {
        positions[i * 3 + 1] -= particles[i].speed

        // Reset position when particle goes out of screen
        if (positions[i * 3 + 1] < -(viewport.height || 10)) {
          positions[i * 3] = (Math.random() - 0.5) * (viewport.width || 10) * 2
          positions[i * 3 + 1] = viewport.height || 10
          positions[i * 3 + 2] = (Math.random() - 0.5) * 10
        }
      }
    }

    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  if (!geometry) return null

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.15}
        color="#88ccff"
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function GradientBackground() {
  const mesh = useRef()
  const { viewport } = useThree()

  // Create a custom shader material for the gradient
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: new THREE.Color("#0a0f2c") },
        color2: { value: new THREE.Color("#050816") },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(mix(color1, color2, vUv.y), 0.2);
        }
      `,
      transparent: true,
    })
  }, [])

  useEffect(() => {
    if (mesh.current && viewport) {
      mesh.current.position.z = -5
      mesh.current.scale.x = (viewport.width || 10) * 2
      mesh.current.scale.y = (viewport.height || 10) * 2
    }
  }, [viewport])

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}


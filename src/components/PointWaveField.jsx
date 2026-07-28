import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_mouse_strength;
uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_background;

out vec4 outColor;

float softDot(vec2 cell, float radius) {
  float distanceToCenter = length(cell);
  float feather = max(fwidth(distanceToCenter) * 1.35, 0.012);
  return 1.0 - smoothstep(radius - feather, radius + feather, distanceToCenter);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);

  // The rows widen toward the bottom, giving the field a quiet sense of depth.
  float depth = smoothstep(0.02, 0.98, uv.y);
  float perspective = mix(0.48, 1.12, depth);
  vec2 plane = vec2((uv.x - 0.5) * aspect / perspective, uv.y);

  float drift = u_time * 0.018;
  plane.x += drift;

  float broadWave = sin(plane.x * 6.4 - u_time * 0.42) * 0.035;
  float fineWave = sin(plane.x * 12.0 + u_time * 0.24 + uv.y * 3.0) * 0.012;
  plane.y += (broadWave + fineWave) * mix(0.35, 1.0, depth);

  vec2 mouseDelta = vec2(
    (uv.x - u_mouse.x) * aspect,
    uv.y - u_mouse.y
  );
  float mouseDistance = length(mouseDelta);
  float mouseFalloff = exp(-mouseDistance * mouseDistance * 12.0) * u_mouse_strength;
  float ripple = sin(mouseDistance * 27.0 - u_time * 1.25) * 0.024;
  plane.y += ripple * mouseFalloff;
  plane.x += mouseDelta.x * mouseFalloff * 0.025;

  vec2 density = vec2(34.0, 17.0);
  vec2 grid = plane * density;
  vec2 cell = fract(grid) - 0.5;

  float sizePulse = 0.5 + 0.5 * sin(
    floor(grid.x) * 0.34 +
    floor(grid.y) * 0.21 -
    u_time * 0.5
  );
  float radius = mix(0.055, 0.092, depth) + sizePulse * 0.008;
  float dots = softDot(cell, radius);

  float edgeFade =
    smoothstep(0.02, 0.18, uv.y) *
    smoothstep(0.01, 0.24, 1.0 - uv.y);
  float centerRestraint = mix(0.62, 1.0, smoothstep(0.18, 0.82, depth));
  float alpha = dots * edgeFade * centerRestraint * 0.25;

  // Render an opaque surface that matches the page. This avoids the
  // browser-specific translucent WebGL compositing paths entirely.
  outColor = vec4(mix(u_background, u_color, alpha), 1.0);
}`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function PointWaveField({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let gl;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        preserveDrawingBuffer: false,
        stencil: false,
      });
    } catch {
      canvas.hidden = true;
      return undefined;
    }

    if (!gl) {
      canvas.hidden = true;
      return undefined;
    }

    let program;
    try {
      program = createProgram(gl);
    } catch {
      canvas.hidden = true;
      return undefined;
    }

    if (!program) {
      canvas.hidden = true;
      return undefined;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseLocation = gl.getUniformLocation(program, 'u_mouse');
    const mouseStrengthLocation = gl.getUniformLocation(program, 'u_mouse_strength');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const colorLocation = gl.getUniformLocation(program, 'u_color');
    const backgroundLocation = gl.getUniformLocation(program, 'u_background');

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const pointer = {
      currentX: 0.5,
      currentY: 0.5,
      currentStrength: 0,
      targetX: 0.5,
      targetY: 0.5,
      targetStrength: 0,
    };

    let animationFrame = null;
    let isIntersecting = true;
    let isDocumentVisible = !document.hidden;
    let startTime = performance.now();

    const updateColor = () => {
      gl.useProgram(program);
      if (theme === 'dark') {
        gl.uniform3f(colorLocation, 0.945, 0.945, 0.929);
        gl.uniform3f(backgroundLocation, 0.039, 0.039, 0.039);
        gl.clearColor(0.039, 0.039, 0.039, 1);
      } else {
        gl.uniform3f(colorLocation, 0.039, 0.039, 0.039);
        gl.uniform3f(backgroundLocation, 0.957, 0.957, 0.941);
        gl.clearColor(0.957, 0.957, 0.941, 1);
      }
    };

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const maxDpr = window.innerWidth <= 720 ? 1 : 1.35;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const displayWidth = Math.max(1, Math.round(width * dpr));
      const displayHeight = Math.max(1, Math.round(height * dpr));

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      gl.viewport(0, 0, displayWidth, displayHeight);
      gl.uniform2f(resolutionLocation, displayWidth, displayHeight);
    };

    const draw = (now = performance.now()) => {
      animationFrame = null;
      resize();

      pointer.currentX += (pointer.targetX - pointer.currentX) * 0.08;
      pointer.currentY += (pointer.targetY - pointer.currentY) * 0.08;
      pointer.currentStrength += (
        pointer.targetStrength - pointer.currentStrength
      ) * 0.075;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(mouseLocation, pointer.currentX, pointer.currentY);
      gl.uniform1f(mouseStrengthLocation, pointer.currentStrength);
      gl.uniform1f(timeLocation, reducedMotion.matches ? 0 : (now - startTime) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!reducedMotion.matches && isIntersecting && isDocumentVisible) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const requestDraw = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const onPointerMove = (event) => {
      if (!finePointer.matches) return;

      const rect = canvas.getBoundingClientRect();
      const inside = (
        event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom
      );

      pointer.targetStrength = inside ? 1 : 0;
      if (inside) {
        pointer.targetX = (event.clientX - rect.left) / rect.width;
        pointer.targetY = 1 - ((event.clientY - rect.top) / rect.height);
      }
      requestDraw();
    };

    const onPointerLeave = () => {
      pointer.targetStrength = 0;
      requestDraw();
    };

    const onVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      if (isDocumentVisible) {
        startTime = performance.now();
        requestDraw();
      } else if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const onMotionChange = () => requestDraw();
    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(requestDraw)
      : null;
    const intersectionObserver = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          requestDraw();
        } else if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
      })
      : null;

    resizeObserver?.observe(canvas);
    intersectionObserver?.observe(canvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', requestDraw, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', onMotionChange);
    } else {
      reducedMotion.addListener?.(onMotionChange);
    }

    updateColor();
    requestDraw();

    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', requestDraw);
      document.documentElement.removeEventListener('mouseleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (typeof reducedMotion.removeEventListener === 'function') {
        reducedMotion.removeEventListener('change', onMotionChange);
      } else {
        reducedMotion.removeListener?.(onMotionChange);
      }
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, [theme]);

  return (
    <div className="point-wave-field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

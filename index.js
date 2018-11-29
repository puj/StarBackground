var color = 0x000000;

// Create your main scene
var scene = new THREE.Scene();

// Create your main camera
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create lights
var light = new THREE.PointLight(0xEEEEEE);
light.position.set(20, 0, 20);
scene.add(light);

var lightAmb = new THREE.AmbientLight(0x777777);
scene.add(lightAmb);


// Create your background scene
const canvas = document.getElementById('canvas-webgl');
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
});

const resolution = new THREE.Vector2();
const clock = new THREE.Clock();
var backgroundScene = new THREE.Scene();
var backgroundCamera = new THREE.Camera();


renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


// Set up the main camera
camera.position.z = 5;

// Load the background texture
const uniforms = {
    time: {
        type: 'f',
        value: 0
    },
    resolution: {
        type: 'v2',
        value: null
    }
};

var backgroundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2, 0),
    new THREE.RawShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
          precision mediump float;
          attribute vec3 position;
          attribute vec2 uv;
          attribute vec3 instancePosition;
          attribute float delay;
          attribute float rotate;
  
          uniform mat4 projectionMatrix;
          uniform mat4 modelViewMatrix;
          uniform float time;
  
          varying vec3 vPosition;
          varying vec2 vUv;
          varying vec3 vColor;
          varying float vBlink;
  
        //   const float duration = 100.0;
        //   const float seperation = 2000.0;
  
        //   mat4 calcrotatemat4z(float radian) {
        //     return mat4(
        //       cos(radian), -sin(radian), 0.0, 0.0,
        //       sin(radian), cos(radian), 0.0, 0.0,
        //       0.0, 0.0, 1.0, 0.0,
        //       0.0, 0.0, 0.0, 1.0
        //     );
        //   }
        //   vec3 converthsvtorgb(vec3 c) {
        //     vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        //     vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
        //     return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
        //   }
  
          void main(void) {
            // float now = mod(time + delay * duration, duration) / duration;
  
            // mat4 rotatemat = calcrotatemat4z(radians(rotate * 360.0) + time * 0.1);
            // vec3 rotateposition = (rotatemat * vec4(position, 1.0)).xyz;
  
            // vec3 moverise = vec3(
            //   (now * 2.0 - 1.0) * (2500.0 - (delay * 2.0 - 1.0) * seperation),
            //   (now * 2.0 - 1.0) * seperation,
            //   sin(radians(time * 50.0 + delay + length(position))) * 30.0
            //   );
            // vec3 updateposition = instanceposition + moverise + rotateposition;
  
            // vec3 hsv = vec3(time * 0.1 + delay * 0.2 + length(instanceposition) * 100.0, 0.5 , 0.8);
            // vec3 rgb = converthsvtorgb(hsv);
            // float blink = (sin(radians(now * 360.0 * 20.0)) + 1.0) * 0.88;
  
            // vec4 mvposition = modelviewmatrix * vec4(updateposition, 1.0);
  
            // vposition = position;
            // vuv = uv;
            // vcolor = rgb;
            // vblink = blink;
  
            // gl_Position = projectionMatrix * mvPosition;
            gl_Position = vec4( position, 1.0 );

          }
        `,
        fragmentShader: `
        precision mediump float;
        
        uniform float time;
        uniform vec2 resolution;
        float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
        vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
        
        float noise(vec3 p){
            vec3 a = floor(p);
            vec3 d = p - a;
            d = d * d * (3.0 - 2.0 * d);
        
            vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
            vec4 k1 = perm(b.xyxy);
            vec4 k2 = perm(k1.xyxy + b.zzww);
        
            vec4 c = k2 + a.zzzz;
            vec4 k3 = perm(c);
            vec4 k4 = perm(c + 1.0);
        
            vec4 o1 = fract(k3 * (1.0 / 41.0));
            vec4 o2 = fract(k4 * (1.0 / 41.0));
        
            vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
            vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
        
            return o4.y * d.y + o4.x * (1.0 - d.y);
        }
        float field(in vec3 p,float s) {
            float strength = 5. + .03 * log(1.e-6 + fract(sin(time) * 4373.11));
            float accum = s/50004.;
            float prev = 0.;
            float tw = 0.;
            for (int i = 0; i < 22; ++i) {
                float mag = dot(p, p);
                p = abs(p) / mag + vec3(-.5, -.4, -1.5);
                float w = exp(-float(i) / 7.);
                accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
                tw += w;
                prev = mag;
            }
            return max(1., 5. * accum / tw - .7);
        }
        
        // Less iterations for second layer
        float field2(in vec3 p, float s) {
            float strength = 7. + .03 * log(1.e-6 + fract(sin(time) * 4373.11));
            float accum = s/4.;
            float prev = 0.;
            float tw = 0.;
            for (int i = 0; i < 22; ++i) {
                float mag = dot(p, p);
                p = abs(p) / mag + vec3(-.5, -.4, -1.5);
                float w = exp(-float(i) / 7.);
                accum += w * exp(-strength * pow(abs(mag - prev), 2.2));
                tw += w;
                prev = mag;
            }
            return max(0., 5. * accum / tw - .7);
        }
        
        vec3 nrand3( vec2 co )
        {
            vec3 a = fract( cos( co.x*8.3e-3 + co.y )*vec3(1.3e5, 4.7e5, 2.9e5) );
            vec3 b = fract( sin( co.x*0.3e-3 + co.y )*vec3(8.1e5, 1.0e5, 0.1e5) );
            vec3 c = mix(a, b, 0.5);
            return c;
        }
        
        
        void main( ) {
            vec2 uv = 2. * gl_FragCoord.xy / resolution.xy - 1.;
            vec2 uvs = uv * resolution.xy / max(resolution.x, resolution.y);
            vec3 p = vec3(uvs / 4., 0) + vec3(1., -1.3, 0.);
            p += .001 * vec3(sin(time / 16.), sin(time / 12.),  sin(time / 128.));
            
            float freqs[4];
            //Sound
            freqs[0] = noise(vec3( 0.01*100.0, 0.25 ,time/10.0) );
            freqs[1] = noise(vec3( 0.07*100.0, 0.25 ,time/10.0) );
            freqs[2] = noise(vec3( 0.15*100.0, 0.25 ,time/10.0) );
            freqs[3] = noise(vec3( 0.30*100.0, 0.25 ,time/10.0) );
        
            float t = field(p,freqs[2]);
            float v = (1. - exp((abs(uv.x) - 1.) * 6.)) * (1. - exp((abs(uv.y) - 1.) * 6.));
            
            //Second Layer
            vec3 p2 = vec3(uvs / (4.+sin(time*0.11)*0.2+0.2+sin(time*0.15)*0.3+0.4), 1.5) + vec3(2., -1.3, -1.);
            p2 += 0.01 * vec3(sin(time / 16.), sin(time / 12.),  sin(time / 128.));
            float t2 = field2(p2,freqs[3]);
            vec4 colorRatio = vec4(0.6, 0.3, 0.4, 1.0);
            float variance = 0.2;
            float timeScaled = time * 0.02;
            colorRatio += variance* vec4(cos(timeScaled), sin(timeScaled), cos(timeScaled), 0);
            vec4 c2 = mix(.4, 1., v) * vec4(1.3 * t2 * t2 * t2 ,1.8  * t2 * t2 , t2* freqs[0], t2) * colorRatio;
            
            
            //Let's add some stars
            //Thanks to http://glsl.heroku.com/e#6904.0
            vec2 seed = p.xy * 2.0;	
            seed = floor(seed * resolution.x);
            vec3 rnd = nrand3( seed );
            vec4 starcolor = vec4(pow(rnd.y,30.0));
            
            //Second Layer
            vec2 seed2 = p2.xy * 2.0;
            seed2 = floor(seed2 * resolution.x);
            vec3 rnd2 = nrand3( seed2 );
            starcolor += vec4(pow(rnd2.y,40.0));
            
            //gl_FragColor = mix(freqs[3]-.3, 1., v) * vec4(1.5*freqs[2] * t * t* t , 1.2*freqs[1] * t * t, freqs[3]*t, 1.0)+c2+starcolor;
            gl_FragColor =  c2+starcolor;
        }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    }));

backgroundMesh.material.depthTest = false;
backgroundMesh.material.depthWrite = false;

backgroundScene.add(backgroundCamera);
backgroundScene.add(backgroundMesh);

const resizeCamera = () => {
    camera.aspect = resolution.x / resolution.y;
    camera.updateProjectionMatrix();
};
const resizeWindow = () => {
    resolution.set(window.innerWidth, window.innerHeight);
    canvas.width = resolution.x;
    canvas.height = resolution.y;
    resizeCamera();
    renderer.setSize(resolution.x, resolution.y);
};

// Rendering function
var render = function() {
    requestAnimationFrame(render);

    // Update the color to set
    if (color < 0xdddddd) color += 0x0000ff;

    renderer.autoClear = false;
    renderer.clear();

    uniforms.time.value += clock.getDelta();
    resolution.set(window.innerWidth, window.innerHeight);
    uniforms.resolution.value = resolution;
    renderer.render(backgroundScene, backgroundCamera);


    window.addEventListener('resize', resizeWindow, 1000);
};


clock.start();
render();
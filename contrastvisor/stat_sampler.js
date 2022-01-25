import { Float16Array } from '@petamoriken/float16';
import * as twgl  from 'twgl.js';
import { range } from './prelude.js'

const vertexShader = `
  attribute highp vec2 aTextureCoord;
  
  uniform highp vec4 uVertexPosition;
    
  varying highp vec2 vTextureCoord;
  
  void main(void) {
    gl_Position = uVertexPosition;
    gl_PointSize = 1.0;
    vTextureCoord = aTextureCoord;
  }
`;

const fragmentShader = `
  varying highp vec2 vTextureCoord;
  
  uniform highp mat3 uCoordMatrix;
  uniform sampler2D uSampler;
  uniform highp vec4 uChannelIndex;

  void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vec2(uCoordMatrix * vec3(vTextureCoord, 1)));
    
    highp float channelValue = dot(uChannelIndex, vec4(texelColor.rgb, 1));
    gl_FragColor = channelValue * vec4(texelColor.rgb, 1);
  }
`;

const positions = [
  [-0.75, 0, 0, 1],
  [-0.25, 0, 0, 1],
  [0.25, 0, 0, 1],
  [0.75, 0, 0, 1]
].map(x => new Float32Array(x))

const channels = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1]
].map(x => new Float32Array(x))


function floatType(gl, bitDepth) {
  if (bitDepth == 16) {
    return {
      type: gl.HALF_FLOAT,
      internalFormat: gl.RGBA16F,
      arrayType: (length) => new Uint16Array(length),
      view: uint16 => new Float16Array(uint16.buffer)
    }
  }
  return {
    type: gl.FLOAT,
    internalFormat: gl.RGBA32F,
    arrayType: (length) => new Float32Array(length),
    view: float32 => float32
  }  
}

export class StatSampler {
  // Sums up the outer product of pixels with themselves

  constructor(gl, nsamples, bitDepth=32) {
    this.gl = gl;
    this.nsamples = nsamples;

    this.floatType = floatType(gl, bitDepth);

    this.program = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
    this.buffers = twgl.createBufferInfoFromArrays(gl, {
      aTextureCoord: Array(nsamples * 2).fill(0).map(_ => Math.random()),
      indices: range(nsamples)
    });

    this.textureSampler = twgl.createSampler(gl, {
      minMag: gl.NEAREST
    });

    this.fb = twgl.createFramebufferInfo(gl, [
      { type: this.floatType.type,
        format: gl.RGBA,
        internalFormat: this.floatType.internalFormat,
        min: gl.NEAREST,
        mag: gl.NEAREST,
        wrap: gl.CLAMP_TO_EDGE
      },
    ], 4, 1);
  }

  sample(texture, region) {
    var gl = this.gl;
    twgl.bindFramebufferInfo(gl, this.fb);
    gl.useProgram(this.program.program);
    
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST)

    twgl.setBuffersAndAttributes(gl, this.program, this.buffers);
    
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);
    
    for (var channel in range(4)) {
      twgl.setUniforms(this.program, {
        uVertexPosition: positions[channel],
        uCoordMatrix: region,
        uChannelIndex: channels[channel],
        uSampler: {
          texture: texture,
          sampler: this.textureSampler
        }
      });
          
      gl.drawElements(gl.POINTS, this.nsamples, gl.UNSIGNED_SHORT, 0);
    }
    
    var pixels = this.floatType.arrayType(4 * 1 * 4);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.readPixels(0, 0, 4, 1, gl.RGBA, this.floatType.type, pixels);
    
    gl.blendFunc(gl.ONE, gl.ZERO);
    gl.disable(gl.BLEND);
    
    return this.floatType.view(pixels);
  }

}
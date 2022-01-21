import * as twgl  from 'twgl.js';
import { mat4, vec3 } from 'gl-matrix';
import { matrixFromDiag, mat4ScaleThenTranslate2d, mat4translateThenScale2d } from './la';

const vertexShader = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform highp mat4 uPositionMatrix;

  varying highp vec2 vTextureCoord;

  void main(void) {
    gl_Position = uPositionMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

const fragmentShader = `
  varying highp vec2 vTextureCoord;

  uniform sampler2D uSampler;
  uniform highp mat4 uColorMatrix;

  void main(void) {
    highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

    gl_FragColor = uColorMatrix * vec4(texelColor.rgb, 1);
  }
`;

export class Screen {

  constructor(gl) {
    this.gl = gl;

    this.program = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
    this.buffers = twgl.createBufferInfoFromArrays(gl, {
      aVertexPosition: [
        -1.0, -1.0,  0,
         1.0, -1.0,  0,
         1.0,  1.0,  0,
        -1.0,  1.0,  0
      ],
      aTextureCoord:  [
        0.0,  1.0,
        1.0,  1.0,
        1.0,  0.0,
        0.0,  0.0
      ],
      indices: [
        0,  1,  2,
        0,  2,  3
      ]
    });
  }


  display(colorMatrix, texture, width, height, projection) {
    var gl = this.gl

    var bounds = gl.canvas.getBoundingClientRect();
    // var scale = Math.min(1, bounds.width*window.devicePixelRatio/width, bounds.height*window.devicePixelRatio/height);

    gl.canvas.width = bounds.width*window.devicePixelRatio;
    gl.canvas.height = bounds.height*window.devicePixelRatio;

    var dataUnit = Math.max(width, height);
    var dataUnitWidth = width / dataUnit;
    var dataUnitHeight = height / dataUnit;
    var positionMatrix = mat4.create();
    positionMatrix[0] = 0.5*dataUnitWidth;
    positionMatrix[4*1 + 1] = -0.5*dataUnitHeight;

    var screenUnit = Math.max(bounds.width, bounds.height);
    var screenUnitWidth = bounds.width / screenUnit
    var screenUnitHeight = bounds.height / screenUnit;
    var viewMatrix = mat4.create();
    viewMatrix[0] = 2/screenUnitWidth;
    viewMatrix[4*1 + 1] = -2/screenUnitHeight;
 
    var minScale = Math.min(screenUnitWidth/dataUnitWidth, screenUnitHeight/dataUnitHeight);

    if (projection) {
      mat4.multiply(positionMatrix, projection, positionMatrix);
    }
    mat4.multiply(positionMatrix, viewMatrix, positionMatrix);
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.program.program);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST); 
    gl.depthFunc(gl.LEQUAL); 
    
    twgl.setBuffersAndAttributes(gl, this.program, this.buffers);
    
    twgl.setUniforms(this.program, {
      uPositionMatrix: positionMatrix,
      uSampler: {texture: texture},
      uColorMatrix: colorMatrix
    });
  
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}

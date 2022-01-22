import * as twgl  from 'twgl.js';
import { mat4, vec3 } from 'gl-matrix';

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


  display(colorMatrix, texture, width, height, projection, resolution=null) {
    var gl = this.gl

    var bounds = gl.canvas.getBoundingClientRect();

    if (resolution) {
      gl.canvas.width = resolution.width;
      gl.canvas.height = resolution.height;
    } else {
      // Use screen resolution
      gl.canvas.width = bounds.width*window.devicePixelRatio;
      gl.canvas.height = bounds.height*window.devicePixelRatio;
    }


    var dataUnit = Math.max(width, height);
    var dataUnitWidth = width / dataUnit;
    var dataUnitHeight = height / dataUnit;
    var positionMatrix = mat4.create();
    positionMatrix[0] = 0.5*dataUnitWidth;
    positionMatrix[4*1 + 1] = -0.5*dataUnitHeight;

    // scale from screen unit (canvas bounds) to canvas units (canvas draw area size)
    const screenUnit = Math.max(bounds.width, bounds.height);
    const screenUnitWidth = bounds.width / screenUnit;
    const screenUnitHeight = bounds.height / screenUnit;
    
    const drawUnit = Math.max(gl.canvas.width, gl.canvas.height);
    const drawUnitWidth = gl.canvas.width / drawUnit
    const drawUnitHeight = gl.canvas.height / drawUnit;

    const scale = Math.max(drawUnitWidth/screenUnitWidth, drawUnitHeight/screenUnitHeight);

    const viewMatrix = mat4.create();
    viewMatrix[0] = 2/drawUnitWidth*scale;
    viewMatrix[4*1 + 1] = -2/drawUnitHeight*scale;

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

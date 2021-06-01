import { mat4 } from 'gl-matrix';
import {
  Matrix,
  EigenvalueDecomposition,
  inverse
} from 'ml-matrix';
import { range } from './prelude.js'

// create and convert and map gl-matrix mat4 and ml-matrix Matrix

export function mat4From(f) {
  // create a mat4 from a function
  return mat4.fromValues(
    f(0,0), f(1,0), f(2,0), f(3,0),
    f(0,1), f(1,1), f(2,1), f(3,1),
    f(0,2), f(1,2), f(2,2), f(3,2),
    f(0,3), f(1,3), f(2,3), f(3,3)
  );
}

export function mat4FromMatrix(m) {
  // create a mat4 matrix, filling with 1 on the diagonal and 0 elsewhere
  return mat4From((r, c) => (r < m.rows && c < m.columns) ? m.get(r, c) : r == c ? 1 : 0);
}
  
export function mat4ToMatrix(m) {
  // convert a gl-matrix mat4 to an ml-matrix Matrix
  return matrixFrom(4, 4, (r, c) => m[c*4 + r]);
}

export function matrixFrom(nRows, nCols, f) {
  return new Matrix(range(nRows).map(r => range(nCols).map(c => f(r, c))));
}

export function matrixFromDiag(n, f) {
  return matrixFrom(n, n, (r, c) => r == c ? f(r) : 0);
}

export function mapDiagonal(m, f) {
  return matrixFrom(m.rows, m.columns, (r, c) => r == c ? f(m.get(r, c)) : 0);
}

export function mapMatrix(m, f) {
  return matrixFrom(m.rows, m.columns, (r, c) => f(m.get(r, c)));
}

function fopt(f) {
  // Apply a function if it's a function, otherwise use constant function
  f = f ?? (x => x);
  if (!f instanceof Function) {
    return _ => f;
  }
  return f;
}

export function decorStretcher(cov, means, options) {
  // Takes a 3x3 covariance Matrix and a vec3 of means
  // Returns a 4x4 mat4 that performs decorrelation stretch on 3 dimensional vectors augmented with a 1 bias dimension

  var useCorr = options.corr ?? false;
  
  var sigma = mapDiagonal(cov, Math.sqrt);
  var isigma = mapDiagonal(sigma, x => 1/x);
  // isigma = inverse(sigma);

  var cor = cov;
  if (useCorr) {
    var cor = isigma.mmul(cov).mmul(isigma);
  }

  var evDecomp = new EigenvalueDecomposition(cor);
  var scale = mapDiagonal(evDecomp.diagonalMatrix, x => 1/Math.sqrt(x));

  var sigmaOut = fopt(options.sigma)(sigma);

  var t = sigmaOut.mmul(evDecomp.eigenvectorMatrix).mmul(scale).mmul(evDecomp.eigenvectorMatrix.transpose());
  if (useCorr) {
    t = t.mmul(isigma);
  }
  
  var mat4t = mat4FromMatrix(t);

  var negMeans = means.map(x => x * -1);  
  var addMeans = fopt(options.mean)(means);

  var subMean = mat4.create();
  mat4.fromTranslation(subMean, negMeans);

  var addMean = mat4.create();
  mat4.fromTranslation(addMean, addMeans);

  mat4.multiply(mat4t, mat4t, subMean);
  mat4.multiply(mat4t, addMean, mat4t);

  return mat4t;
}

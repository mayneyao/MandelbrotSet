const MAX_ITER_COUNT = 80

// 复数计算
function complex_number_square(re: number, im: number) {
  return [re * re - im * im, 2 * re * im];
}

function complex_number_add(re1: number, im1: number, re2: number, im2: number) {
  return [re1 + re2, im1 + im2];
}

// 曼德博集 ifs 的定义
// z0 = 0
// f(z0) = z0^2 + c
// f(z1) = z0^2 + c
// f(z2) = z1^2 + c
// f(z3) = z2^2 + c
// f(z4) = z3^2 + c
export function getIterCountAndIsInMandlebrotSet(c) {
  let iter_count = 0;
  let length = 0;
  let z: number[] = [0, 0]
  const zSet = new Set();
  do {
    // z1 = z0^2 + c
    const zSquare = complex_number_square(z[0], z[1]);
    z = complex_number_add(zSquare[0], zSquare[1], c[0], c[1])
    if (zSet.has(z)) {
      return [iter_count, length <= 2]
    }
    length = Math.sqrt(z[0] * z[0] + z[1] * z[1])
    // length = z[0] * z[0] + z[1] * z[1]
    iter_count++;
    zSet.add(z)
    // 如果迭代 80 次都没有变成无穷大，那么理解为是收敛的
  } while (iter_count < MAX_ITER_COUNT && length <= 2)
  return [iter_count, length <= 2]
}
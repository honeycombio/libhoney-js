// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * a simple function that offers the same interface
 * for both Map and object key interation.
 * @private
 */
export default function foreach<T>(
  col: Map<string, T> | Record<string, T>,
  f: (v: T, k: string) => void
): void {
  if (!col) {
    return;
  }
  if (col instanceof Map) {
    col.forEach(f);
  } else {
    Object.getOwnPropertyNames(col).forEach(k => f(col[k], k));
  }
}

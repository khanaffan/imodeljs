/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import { Geometry } from "../Geometry";
import { Angle } from "../geometry3d/Angle";
import { Point2d, Vector2d } from "../geometry3d/Point2dVector2d";
import { XYZ, Point3d, Vector3d } from "../geometry3d/Point3dVector3d";
import { Segment1d } from "../geometry3d/Segment1d";
import { Transform } from "../geometry3d/Transform";
import { Matrix3d } from "../geometry3d/Matrix3d";

import { GrowableFloat64Array } from "../geometry3d/GrowableArray";
import { Range3d } from "../geometry3d/Range";
import { GeometryQuery } from "../curve/GeometryQuery";
import { Arc3d } from "../curve/Arc3d";
import { LineString3d } from "../curve/LineString3d";
import { Matrix4d } from "../geometry4d/Matrix4d";
import { Point4d } from "../geometry4d/Point4d";
import { Complex } from "../numerics/Complex";

import { GeometryCoreTestIO } from "./GeometryCoreTestIO";

/* tslint:disable:variable-name no-console*/

export class Checker {
  private _savedErrors: number;
  private _savedOK: number;
  private _numErrors: number;
  private _numOK: number;
  public lastMessage: string = "";
  public static noisy = {
    bsiJSON: false,
    bsiJSONFirstAppearance: false,
    serialization: false,
    stroke: false,
    factorPerpendicularColumns: false,
    symmetricEigenvalues: false,
    momentData: false,
    checkpoint: false,
    flatbufferRoundTrip: false,
    bsplineEvaluation: false,
    tridiagonalsolver: false,
    gaussQuadrature: false,
    quarticRoots: false,
    cubicRoots: false,
    printJSONSuccess: false,
    printJSONFailure: false,
    spirals: false,
    cluster: false,
    clipPlane: false,
    clipTree: false,
    squareWaves: false,
    axisOrderVerify: false,
    parityClipPlanes: false,
    rectangleMoments: false,
    boxMap: false,
    rotMatrixAxisAndAngle: false,
    map4d: false,
    bsijsonValuesQuick: false,
    testTransitionSpiral: true,
    newtonRtoRD: false,
    ACSArrows: false,
    OrderedRotationAngles: false,
    RaggedViewMatrix: false,
  };
  public constructor() { this._numErrors = 0; this._numOK = 0; this._savedErrors = 0; this._savedOK = 0; }
  public getNumErrors(): number { return this._savedErrors + this._numErrors; }
  public getNumOK(): number { return this._numOK + this._savedOK; }

  // ===================================================================================
  // Tests
  // ===================================================================================

  public checkpoint(...params: any[]) {
    // this.show(params);
    if (Checker.noisy.checkpoint || this._numErrors > 0)
      console.log("               (ok ", this._numOK, ")  (errors ", this._numErrors, ")", params);
    this._savedErrors += this._numErrors;
    this._savedOK += this._numOK;
    this._numErrors = 0;
    this._numOK = 0;
  }
  public announceError(...params: any[]): boolean {
    this._numErrors++;
    console.log("ERROR");
    this.show(params);
    return false;
  }
  public announceOK(): boolean {
    this._numOK++;
    return true;
  }
  public testPoint3d(dataA: Point3d, dataB: Point3d, ...params: any[]): boolean {
    if (Geometry.isSamePoint3d(dataA, dataB))
      return this.announceOK();
    this.announceError("expect same Point3d", dataA, dataB, params);
    return false;
  }

  public testPoint3dArray(dataA: Point3d[], dataB: Point3d[], ...params: any[]): boolean {
    if (dataA.length !== dataB.length)
      return this.announceError("mismatched Point3d array lengths", dataA, dataB, params);

    for (let i = 0; i < dataA.length; i++)
      if (!Geometry.isSamePoint3d(dataA[i], dataB[i]))
        return this.announceError("mismatched point at array position " + i,
          dataA, dataB, params);
    return this.announceOK();
  }
  /**
   * Test if number arrays (either or  both possibly undefined) match.
   */
  public testNumberArray(dataA: number[] | Float64Array | undefined, dataB: number[] | Float64Array | undefined, ...params: any[]): boolean {
    const numA = dataA === undefined ? 0 : dataA.length;
    const numB = dataB === undefined ? 0 : dataB.length;
    if (numA !== numB)
      return this.announceError("array length mismatch", dataA, dataB, params);
    if (dataA && dataB) {
      let numError = 0;
      for (let i = 0; i < dataA.length; i++) {
        if (!Geometry.isSameCoordinate(dataA[i], dataB[i]))
          numError++;
      }
      if (numError !== 0)
        return this.announceError("contents different", dataA, dataB, params);
    }
    return this.announceOK();
  }

  /**
   * Test if number arrays (either or  both possibly undefined) match.
   */
  public testNumberArrayG(dataA: number[] | undefined, dataB: GrowableFloat64Array | undefined, ...params: any[]): boolean {
    const numA = dataA === undefined ? 0 : dataA.length;
    const numB = dataB === undefined ? 0 : dataB.length;
    if (numA !== numB)
      return this.announceError("array length mismatch", dataA, dataB, params);
    if (dataA && dataB) {
      let numError = 0;
      for (let i = 0; i < dataA.length; i++) {
        if (!Geometry.isSameCoordinate(dataA[i], dataB.at(i)))
          numError++;
      }
      if (numError !== 0)
        return this.announceError("contents different", dataA, dataB, params);
    }
    return this.announceOK();
  }

  public testRange3d(dataA: Range3d, dataB: Range3d, ...params: any[]): boolean {
    if (dataA.isAlmostEqual(dataB))
      return this.announceOK();
    this.announceError("expect same Range3d", dataA, dataB, params);
    return false;
  }

  public testPoint3dXY(dataA: Point3d, dataB: Point3d, ...params: any[]): boolean {
    if (Geometry.isSamePoint3dXY(dataA, dataB))
      return this.announceOK();
    this.announceError("expect same Point3d XY", dataA, dataB, params);
    return false;
  }

  public testPoint2d(dataA: Point2d, dataB: Point2d, ...params: any[]): boolean {
    if (Geometry.isSamePoint2d(dataA, dataB))
      return this.announceOK();
    this.announceError("expect same Point2d", dataA, dataB, params);
    return false;
  }
  public testBoolean(dataA: boolean, dataB: boolean, ...params: any[]): boolean {
    if (dataA === dataB)
      return this.announceOK();
    this.announceError("Expect same boolean", JSON.stringify(dataA), JSON.stringify(dataB), params);

    return false;
  }
  public testTrue(dataA: boolean, ...params: any[]): boolean {
    if (dataA)
      return this.announceOK();
    this.announceError("Expect true", params);

    return false;
  }

  public testFalse(dataA: boolean, ...params: any[]): boolean {
    if (!dataA)
      return this.announceOK();
    this.announceError("Expect false", params);

    return false;
  }

  public testUndefined(dataA: any, ...params: any[]): boolean {
    if (dataA === undefined)
      return this.announceOK();
    this.announceError("Expect undefined", dataA, params);

    return false;
  }

  public testLE(dataA: number, dataB: number, ...params: any[]): boolean {
    if (dataA <= dataB)
      return this.announceOK();
    this.announceError("Expect dataA <= dataB", dataA, dataB, params);

    return false;
  }

  public testLT(dataA: number, dataB: number, ...params: any[]): boolean {
    if (dataA < dataB)
      return this.announceOK();
    this.announceError("Expect dataA < dataB", dataA, dataB, params);

    return false;
  }

  public testVector3d(dataA: Vector3d, dataB: Vector3d, ...params: any[]): boolean {
    if (Geometry.isSameVector3d(dataA, dataB))
      return this.announceOK();
    return this.announceError(" expect same Vector3d", dataA, dataB, params);
  }

  public testVector2d(dataA: Vector2d, dataB: Vector2d, ...params: any[]): boolean {
    if (Geometry.isSameVector2d(dataA, dataB))
      return this.announceOK();
    return this.announceError(" expect same Vector2d", dataA, dataB, params);
  }

  public testXYZ(dataA: XYZ, dataB: XYZ, ...params: any[]): boolean {
    if (Geometry.isSameXYZ(dataA, dataB))
      return this.announceOK();
    return this.announceError(" expect same XYZ", dataA, dataB, params);
  }

  public testComplex(dataA: Complex, dataB: Complex, ...params: any[]): boolean {
    if (Geometry.isSmallMetricDistance(dataA.distance(dataB)))
      return this.announceOK();
    return this.announceError(" expect same Vector3d", dataA, dataB, params);
  }
  public testPoint4d(dataA: Point4d, dataB: Point4d, ...params: any[]): boolean {
    if (Geometry.isSmallMetricDistance(dataA.distanceXYZW(dataB)))
      return this.announceOK();
    return this.announceError(" expect same Point4d", dataA, dataB, params);
  }

  public testMatrix4d(dataA: Matrix4d, dataB: Matrix4d, ...params: any[]): boolean {
    if (Geometry.isSmallMetricDistance(dataA.maxDiff(dataB)))
      return this.announceOK();
    return this.announceError(" expect same Matrix4d", dataA, dataB, params);
  }

  public testMatrix3d(dataA: Matrix3d, dataB: Matrix3d, ...params: any[]): boolean {
    if (dataA.maxDiff(dataB) < Geometry.smallMetricDistance)
      return this.announceOK();
    return this.announceError("expect same Matrix3d", dataA, dataB, params);
  }

  public testTransform(dataA: Transform, dataB: Transform, ...params: any[]): boolean {
    if (dataA.matrix.maxDiff(dataB.matrix) < Geometry.smallMetricDistance
      && dataA.origin.maxDiff(dataB.origin) < Geometry.smallMetricDistance)
      return this.announceOK();
    return this.announceError("expect same Transform", dataA, dataB, params);
  }

  public testCoordinate(dataA: number, dataB: number, ...params: any[]): boolean {
    if (Geometry.isSameCoordinate(dataA, dataB))
      return this.announceOK();
    return this.announceError("Expect same coordinate", dataA, dataB, params);
  }

  public testSmallRelative(dataA: number, ...params: any[]): boolean {
    if (Geometry.isSmallRelative(dataA))
      return this.announceOK();
    return this.announceError("Expect small relative", dataA, params);
  }

  // return true if dataA is strictly before dataB as a signed toleranced coordinate value.
  public testCoordinateOrder(dataA: number, dataB: number, ...params: any[]): boolean {
    if (dataA + Geometry.smallMetricDistance < dataB)
      return this.announceOK();
    return this.announceError("Expect coordinate order", dataA, dataB, params);
  }

  // return true if dataA is strictly before dataB as a signed toleranced coordinate value.
  public testParallel(dataA: Vector3d, dataB: Vector3d, ...params: any[]): boolean {
    if (dataA.isParallelTo(dataB))
      return this.announceOK();
    return this.announceError("Expect parallel", dataA, dataB, params);
  }

  // return true if dataA is strictly before dataB as a signed toleranced coordinate value.
  public testPerpendicular(dataA: Vector3d, dataB: Vector3d, ...params: any[]): boolean {
    if (dataA.isPerpendicularTo(dataB))
      return this.announceOK();
    return this.announceError("Expect perpendicular", dataA, dataB, params);
  }

  // return true if dataA is strictly before dataB as a signed toleranced coordinate value.
  public testParallel2d(dataA: Vector2d, dataB: Vector2d, ...params: any[]): boolean {
    if (dataA.isParallelTo(dataB))
      return this.announceOK();
    return this.announceError("Expect parallel", dataA, dataB, params);
  }

  // return true if dataA is strictly before dataB as a signed toleranced coordinate value.
  public testPerpendicular2d(dataA: Vector2d, dataB: Vector2d, ...params: any[]): boolean {
    if (dataA.isPerpendicularTo(dataB))
      return this.announceOK();
    return this.announceError("Expect perpendicular", dataA, dataB, params);
  }

  // return true if dataA is strictly before dataB as a signed toleranced coordinate value.
  public testExactNumber(dataA: number, dataB: number, ...params: any[]): boolean {
    if (dataA === dataB)
      return this.announceOK();
    return this.announceError("Expect exact number", dataA, dataB, params);
  }

  // return true if dataA is strictly before dataB as a signed toleranced coordinate value.
  public testContainsCoordinate(dataA: GrowableFloat64Array, dataB: number, ...params: any[]): boolean {
    for (let i = 0; i < dataA.length; i++)
      if (Geometry.isSameCoordinate(dataA.at(i), dataB)) {
        return this.announceOK();
      }
    return this.announceError("Expect containsCoordinate", dataA, dataB, params);
  }
  public testArrayContainsCoordinate(dataA: Float64Array | number[], dataB: number, ...params: any[]): boolean {
    // simple number array.
    for (const a of dataA)
      if (Geometry.isSameCoordinate(a, dataB)) {
        return this.announceOK();
      }
    return this.announceError("Expect containsCoordinate", dataA, dataB, params);
  }
  // return true if dataA and dataB are almost equal as Segment1d.
  public testSegment1d(dataA: Segment1d, dataB: Segment1d, ...params: any[]): boolean {
    if (dataA.isAlmostEqual(dataB))
      return this.announceOK();
    return this.announceError("Expect exact number", dataA, dataB, params);
  }

  public testPointer(value: any, ...params: any[]): boolean {
    if (value)
      return this.announceOK();
    return this.announceError("Expect pointer", value, params);
  }
  public testAngleNoShift(dataA: Angle, dataB: Angle, ...params: any[]): boolean {
    if (dataA.isAlmostEqualNoPeriodShift(dataB))
      return this.announceOK();
    return this.announceError("Angle.isAlmostEqualNoPeriodShift", params);
  }

  public testAngleAllowShift(dataA: Angle, dataB: Angle, ...params: any[]): boolean {
    if (dataA.isAlmostEqualAllowPeriodShift(dataB))
      return this.announceOK();
    return this.announceError("Angle.isAlmostEqualNoPeriodShift", params);
  }

  // ===================================================================================
  // Caching and Storage
  // ===================================================================================

  private static _cache: GeometryQuery[] = [];
  private static _transform: Transform = Transform.createIdentity();

  public static setTransform(transform: Transform) { Checker._transform = transform; }
  public static getTransform(): Transform { return Checker._transform; }

  public static saveTransformed(g: GeometryQuery, maxCoordinate: number = 1.0e12) {
    const range = g.range();

    if (!range.isNull && range.maxAbs() <= maxCoordinate) {
      Checker._cache.push(g.clone()!);
      Checker._cache[Checker._cache.length - 1].tryTransformInPlace(Checker._transform);
    }
  }

  public static saveTransformedLineString(points: Point3d[]) {
    const cv = LineString3d.createPoints(points);
    Checker.saveTransformed(cv);
  }

  public static saveTransformedMarker(xyz: Point3d, markerSize: number) {
    let cp: any;
    if (markerSize > 0) {
      cp = LineString3d.createPoints([
        Point3d.create(xyz.x - markerSize, xyz.y, xyz.z),
        Point3d.create(xyz.x + markerSize, xyz.y, xyz.z),
        Point3d.create(xyz.x, xyz.y + markerSize, xyz.z),
        Point3d.create(xyz.x, xyz.y - markerSize, xyz.z),
      ]);
    } else {
      cp = Arc3d.createXY(xyz, Math.abs(markerSize));
    }

    Checker.saveTransformed(cp);
  }

  public static shift(dx: number, dy: number, dz: number = 0) {
    Checker._transform.multiplyTransformTransform(Transform.createTranslationXYZ(dx, dy, dz), Checker._transform);
  }

  // ===================================================================================
  // Output
  // ===================================================================================

  public show(...params: any[]) {
    let p;
    for (p of params) {
      console.log(p);
    }
  }

  public static clearGeometry(name: string, outDir: string) {
    GeometryCoreTestIO.saveGeometry(Checker._cache, outDir, name);

    Checker._cache.length = 0;
    // Checker.lowerRightBaseIndex = 0;  // First index of "lower right" range
    Transform.createIdentity(Checker._transform);
  }
}

export class SaveAndRestoreCheckTransform {
  public baseTransform: Transform;
  public finalShift: Vector3d;

  public constructor(dxFinal: number, dyFinal: number, dzFinal: number) {
    this.finalShift = Vector3d.create(dxFinal, dyFinal, dzFinal);
    this.baseTransform = Checker.getTransform().clone();
  }

  public doShift() {
    Checker.setTransform(this.baseTransform);
    Checker.shift(this.finalShift.x, this.finalShift.y, this.finalShift.z);
    this.baseTransform = Checker.getTransform();
  }
}

/**
 * Accumulate given values. Return the mean, standard deviation.
 */
export class UsageSums {
  public sums: Float64Array = new Float64Array(3);
  public min: number;
  public max: number;

  public constructor() {
    this.min = Number.MAX_VALUE; this.max = -Number.MAX_VALUE;
    this.clearSums();
  }

  public get count(): number { return this.sums[0]; }
  public get mean(): number { return this.sums[0] > 0 ? this.sums[1] / this.sums[0] : 0.0; }

  public clearSums() {
    this.sums[0] = this.sums[1] = this.sums[2] = 0;
    this.min = Number.MAX_VALUE;
    this.max = -Number.MAX_VALUE;
  }

  public accumulate(x: number) {
    this.sums[0] += 1;
    this.sums[1] += x;
    this.sums[2] += x * x;
    if (x > this.max) this.max = x;
    if (x < this.min) this.min = x;
  }
}

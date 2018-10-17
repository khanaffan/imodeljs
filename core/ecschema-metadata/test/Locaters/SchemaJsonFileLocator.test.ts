/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { assert } from "chai";
import * as path from "path";

import SchemaJsonFileLocater from "./../../src/Deserialization/SchemaJsonFileLocater";
import { FileSchemaKey } from "./../../src/Deserialization/SchemaFileLocater";
import SchemaContext from "./../../src/Context";
import { SchemaMatchType } from "./../../src/ECObjects";
import SchemaKey from "./../../src/SchemaKey";
import { ECObjectsError, ECObjectsStatus } from "./../../src/Exception";

describe("SchemaJsonFileLocater tests: ", () => {
  let locater: SchemaJsonFileLocater;
  let context: SchemaContext;

  beforeEach(() => {
    locater = new SchemaJsonFileLocater();

    locater.addSchemaSearchPath(path.join(__dirname, "..", "Assets"));
    context = new SchemaContext();
    context.addLocater(locater);
  });

  it("locate valid schema with multiple references", async () => {
    // Arrange
    const schemaKey = new SchemaKey("SchemaA", 1, 1, 1);

    console.log(schemaKey.toString());

    // Act
    const schema = await context.getSchema(schemaKey, SchemaMatchType.Exact);

    // Assert
    assert.isDefined(schema);
    assert.equal(schema!.schemaKey.name, "SchemaA");
    assert.equal(schema!.schemaKey.version.toString(), "1.1.1");
  });

  it("locate valid schema with multiple references synchronously", () => {
    // Arrange
    const schemaKey = new SchemaKey("SchemaA", 1, 1, 1);

    // Act
    const schema = context.getSchemaSync(schemaKey, SchemaMatchType.Exact);

    // Assert
    assert.isDefined(schema);
    assert.equal(schema!.schemaKey.name, "SchemaA");
    assert.equal(schema!.schemaKey.version.toString(), "1.1.1");
  });

  it("getSchema called multiple times for same schema", async () => {
    // Arrange
    const schemaKey = new SchemaKey("SchemaD", 4, 4, 4);

    // Act
    const locater1 = await locater.getSchema(schemaKey, SchemaMatchType.Exact);
    const locater2 = await locater.getSchema(schemaKey, SchemaMatchType.Exact);
    const context1 = await context.getSchema(schemaKey, SchemaMatchType.Exact);
    const context2 = await context.getSchema(schemaKey, SchemaMatchType.Exact);

    // Assert
    // locater should not cache, but context should cache
    assert.notEqual(locater1, locater2);
    assert.notEqual(locater1, context1);
    assert.equal(context1, context2);
  });

  it("getSchema called multiple times for same schema synchronously", () => {
    // Arrange
    const schemaKey = new SchemaKey("SchemaD", 4, 4, 4);

    // Act
    const locater1 = locater.getSchemaSync(schemaKey, SchemaMatchType.Exact);
    const locater2 = locater.getSchemaSync(schemaKey, SchemaMatchType.Exact);
    const context1 = context.getSchemaSync(schemaKey, SchemaMatchType.Exact);
    const context2 = context.getSchemaSync(schemaKey, SchemaMatchType.Exact);

    // Assert
    // locater should not cache, but context should cache
    assert.notEqual(locater1, locater2);
    assert.notEqual(locater1, context1);
    assert.equal(context1, context2);
  });

  it("getSchema which does not exist, returns undefined", async () => {
    // Arrange
    const schemaKey = new SchemaKey("DoesNotExist");

    // Act
    const result = await locater.getSchema(schemaKey, SchemaMatchType.Exact);

    assert.isUndefined(result);
  });

  it("loadSchema from file, bad schema name, throws", async () => {
    // Arrange
    const schemaKey = new SchemaKey("BadSchemaName");

    // Act / Assert
    try {
      await locater.getSchema(schemaKey, SchemaMatchType.Exact);
    } catch (e) {
      const error = e as ECObjectsError;
      assert.equal(error.errorNumber, ECObjectsStatus.InvalidECJson);
      return;
    }

    assert.fail(0, 1, "Expected ECObjects exception");
  });

  it("loadSchema from file, bad schema version, throws", async () => {
    // Arrange
    const schemaKey = new SchemaKey("BadSchemaVersion");

    // Act / Assert
    try {
      await locater.getSchema(schemaKey, SchemaMatchType.Exact);
    } catch (e) {
      const error = e as ECObjectsError;
      assert.equal(error.errorNumber, ECObjectsStatus.InvalidECJson);
      return;
    }

    assert.fail(0, 1, "Expected ECObjects exception");
  });

  it("getSchema, full version, succeeds", async () => {
    // Arrange

    // Act
    const stub = await locater.getSchema(new SchemaKey("SchemaA", 1, 1, 1), SchemaMatchType.Exact, context);

    // Assert
    assert.isDefined(stub);
    const key = stub!.schemaKey as FileSchemaKey;
    assert.equal(key.name, "SchemaA");
    assert.equal(key.version.toString(), "1.1.1");
  });

  it("getSchema, exact version, wrong minor, fails", async () => {
    // Act
    const schema = await locater.getSchema(new SchemaKey("SchemaA", 1, 1, 2), SchemaMatchType.Exact, context);

    // Assert
    assert.isUndefined(schema);
  });

  it("getSchema, latest, succeeds", async () => {
    // Act
    const schema = await locater.getSchema(new SchemaKey("SchemaA", 1, 1, 0), SchemaMatchType.Latest, context);

    // Assert
    assert.isDefined(schema);
    assert.equal(schema!.schemaKey.name, "SchemaA");
    assert.equal(schema!.schemaKey.version.toString(), "2.0.2");
  });

  it("getSchema, latest write compatible, succeeds", async () => {
    // Act
    const stub = await locater.getSchema(new SchemaKey("SchemaA", 1, 1, 0), SchemaMatchType.LatestWriteCompatible, context);

    // Assert
    assert.isDefined(stub);
    assert.equal(stub!.schemaKey.name, "SchemaA");
    assert.equal(stub!.schemaKey.version.toString(), "1.1.1");
  });

  it("getSchema, latest write compatible, write version wrong, fails", async () => {
    // Act
    const stub = await locater.getSchema(new SchemaKey("SchemaA", 1, 2, 0), SchemaMatchType.LatestWriteCompatible, context);

    // Assert
    assert.isUndefined(stub);
  });

  it("getSchema, latest read compatible, succeeds", async () => {
    // Act
    const stub = await locater.getSchema(new SchemaKey("SchemaA", 1, 0, 0), SchemaMatchType.LatestReadCompatible, context);

    // Assert
    assert.isDefined(stub);
    assert.equal(stub!.schemaKey.name, "SchemaA");
    assert.equal(stub!.schemaKey.version.toString(), "1.1.1");
  });

  it("getSchema, latest read compatible, read version wrong, fails", async () => {
    // Act
    const stub = await locater.getSchema(new SchemaKey("SchemaA", 2, 1, 1), SchemaMatchType.LatestReadCompatible, context);

    // Assert
    assert.isUndefined(stub);
  });
});

# Online3DViewer (OV) Library Documentation

## Core Utilities

### `IsDefined(val): boolean`
Returns true if val is not undefined and not null.

### `ValueOrDefault(val, def): any`
Returns val if defined, otherwise def.

### `CopyObjectAttributes(src, dest): void`
Copies all defined properties from src to dest.

### `IsObjectEmpty(obj): boolean`
True if obj has no own keys.

### `FormatString(template, ...args): string`
Replaces `{0}`, `{1}`, etc. in template with args.

### `EscapeHtmlChars(str): string`
Escapes `<` and `>` to HTML entities.

## EventNotifier

```
class EventNotifier {
  AddEventListener(eventId: string, listener: Function): void
  HasEventListener(eventId: string): boolean
  GetEventNotifier(eventId: string): Function  // returns a no-arg function that calls NotifyEventListeners
  NotifyEventListeners(eventId: string, ...args): void
}
```

## Localization

```
SetLocalizedStrings(localizedStrings: object): void
SetLanguageCode(languageCode: string): void
Loc(str: string): string              // returns localized string or original
FLoc(str: string, ...args): string    // Loc + FormatString
```

## TaskRunner

```
class TaskRunner {
  Run(count: number, callbacks: {runTask(index, ready), onReady?}): void
  RunBatch(count: number, batchCount: number, callbacks: {runTask(firstIndex, lastIndex, ready), onReady?}): void
}
RunTaskAsync(task: Function): void           // setTimeout 10ms
RunTasks(count, callbacks): void             // creates TaskRunner and runs
RunTasksBatch(count, batchCount, callbacks): void
WaitWhile(expression: () => boolean): void   // polls every 10ms until expression returns false
```

## Geometry

### Constants & Comparisons (`geometry.js`)

```
Eps = 0.00000001
BigEps = 0.0001
RadDeg = 57.29577951308232   // radians to degrees multiplier
DegRad = 0.017453292519943   // degrees to radians multiplier

Direction = { X: 1, Y: 2, Z: 3 }

IsZero(a): boolean
IsLower(a, b): boolean
IsGreater(a, b): boolean
IsLowerOrEqual(a, b): boolean
IsGreaterOrEqual(a, b): boolean
IsEqual(a, b): boolean
IsEqualEps(a, b, eps): boolean
IsPositive(a): boolean
IsNegative(a): boolean
```

### Coord2D

```
class Coord2D {
  constructor(x: number, y: number)
  x: number; y: number
  Clone(): Coord2D
}
CoordIsEqual2D(a: Coord2D, b: Coord2D): boolean
AddCoord2D(a, b): Coord2D
SubCoord2D(a, b): Coord2D
CoordDistance2D(a, b): number
DotVector2D(a, b): number
```

### Coord3D

```
class Coord3D {
  constructor(x: number, y: number, z: number)
  x: number; y: number; z: number
  Length(): number
  MultiplyScalar(scalar: number): this
  Normalize(): this
  Offset(direction: Coord3D, distance: number): this
  Rotate(axis: Coord3D, angle: number, origo: Coord3D): this
  Clone(): Coord3D
}
CoordIsEqual3D(a, b): boolean
AddCoord3D(a, b): Coord3D
SubCoord3D(a, b): Coord3D
CoordDistance3D(a, b): number
DotVector3D(a, b): number
VectorAngle3D(a, b): number        // angle in radians
CrossVector3D(a, b): Coord3D
VectorLength3D(x, y, z): number
ArrayToCoord3D(arr: number[]): Coord3D
```

### Coord4D

```
class Coord4D {
  constructor(x, y, z, w: number)
  Clone(): Coord4D
}
```

### Quaternion

```
class Quaternion {
  constructor(x, y, z, w: number)
}
QuaternionIsEqual(a, b): boolean
ArrayToQuaternion(arr: number[4]): Quaternion
QuaternionFromAxisAngle(axis: Coord3D, angle: number): Quaternion
QuaternionFromXYZ(x, y, z: number, mode: 'XYZ'|'YXZ'|'ZXY'|'ZYX'|'YZX'|'XZY'): Quaternion|null
```

### Matrix (4×4, column-major flat array of 16)

```
class Matrix {
  constructor(matrix?: number[16])
  IsValid(): boolean
  Set(matrix: number[16]): this
  Get(): number[16]
  Clone(): Matrix
  CreateIdentity(): this
  IsIdentity(): boolean
  CreateTranslation(x, y, z): this
  CreateRotation(x, y, z, w): this          // from quaternion components
  CreateRotationAxisAngle(axis: Coord3D, angle: number): this
  CreateScale(x, y, z): this
  ComposeTRS(translation: Coord3D, rotation: Quaternion, scale: Coord3D): this
  DecomposeTRS(): { translation: Coord3D, rotation: Quaternion, scale: Coord3D }
  Determinant(): number
  Invert(): Matrix|null
  Transpose(): Matrix
  InvertTranspose(): Matrix|null
  MultiplyVector(vector: Coord4D): Coord4D
  MultiplyMatrix(matrix: Matrix): Matrix
}
MatrixIsEqual(a, b): boolean
```

### Transformation

```
class Transformation {
  constructor(matrix?: Matrix)         // defaults to identity
  SetMatrix(matrix: Matrix): this
  GetMatrix(): Matrix
  IsIdentity(): boolean
  AppendMatrix(matrix: Matrix): this
  Append(transformation: Transformation): this
  TransformCoord3D(coord: Coord3D): Coord3D
  Clone(): Transformation
}
TransformationIsEqual(a, b): boolean
```

### Box3D

```
class Box3D {
  constructor(min: Coord3D, max: Coord3D)
  GetMin(): Coord3D
  GetMax(): Coord3D
  GetCenter(): Coord3D
}
class BoundingBoxCalculator3D {
  constructor()
  AddPoint(point: Coord3D): void
  GetBox(): Box3D|null
}
```

### Segment2D / Line utilities

```
class Segment2D {
  constructor(beg: Coord2D, end: Coord2D)
  Clone(): Segment2D
}
ProjectPointToSegment2D(segment, point): Coord2D
SegmentPointDistance2D(segment, point): number
```

### Octree

```
class Octree {
  constructor(boundingBox: Box3D, options?: { maxPointsPerNode?: number, maxTreeDepth?: number })
  AddPoint(point: Coord3D, data: any): boolean
  FindPoint(point: Coord3D): any|null
}
```

### Tween Functions

```
BezierTweenFunction(distance, index, count): number
LinearTweenFunction(distance, index, count): number
ParabolicTweenFunction(distance, index, count): number
TweenCoord3D(a: Coord3D, b: Coord3D, count: number, tweenFunc: Function): Coord3D[]
```

## I/O

### FileUtils

```
FileSource = { Url: 1, File: 2, Decompressed: 3 }
FileFormat = { Text: 1, Binary: 2 }

GetFileName(filePath: string): string
GetFileExtension(filePath: string): string       // lowercase, no dot
RequestUrl(url: string, onProgress: (loaded, total) => void): Promise<ArrayBuffer>
ReadFile(file: File, onProgress): Promise<ArrayBuffer>
TransformFileHostUrls(urls: string[]): void      // modifies in-place for dropbox/github raw
IsUrl(str: string): boolean
```

### BufferUtils

```
ArrayBufferToUtf8String(buffer: ArrayBuffer): string
ArrayBufferToAsciiString(buffer: ArrayBuffer): string
AsciiStringToArrayBuffer(str: string): ArrayBuffer
Utf8StringToArrayBuffer(str: string): ArrayBuffer
Base64DataURIToArrayBuffer(uri: string): { mimeType: string, buffer: ArrayBuffer }|null
GetFileExtensionFromMimeType(mimeType: string): string
CreateObjectUrl(content): string
CreateObjectUrlWithMimeType(content, mimeType: string): string
RevokeObjectUrl(url: string): void
```

### BinaryReader

```
class BinaryReader {
  constructor(arrayBuffer: ArrayBuffer, isLittleEndian: boolean)
  GetPosition(): number
  SetPosition(position: number): void
  GetByteLength(): number
  Skip(bytes: number): void
  End(): boolean
  ReadArrayBuffer(byteLength: number): ArrayBuffer
  ReadBoolean8(): boolean
  ReadCharacter8(): number
  ReadUnsignedCharacter8(): number
  ReadInteger16(): number
  ReadUnsignedInteger16(): number
  ReadInteger32(): number
  ReadUnsignedInteger32(): number
  ReadFloat32(): number
  ReadDouble64(): number
}
```

### BinaryWriter

```
class BinaryWriter {
  constructor(byteLength: number, isLittleEndian: boolean)
  GetPosition(): number
  SetPosition(position: number): void
  End(): boolean
  GetBuffer(): ArrayBuffer
  WriteArrayBuffer(arrayBuffer: ArrayBuffer): void
  WriteBoolean8(val: boolean): void
  WriteCharacter8(val: number): void
  WriteUnsignedCharacter8(val: number): void
  WriteInteger16(val): void
  WriteUnsignedInteger16(val): void
  WriteInteger32(val): void
  WriteUnsignedInteger32(val): void
  WriteFloat32(val): void
  WriteDouble64(val): void
}
```

### TextWriter

```
class TextWriter {
  constructor()
  GetText(): string
  Indent(diff: number): void          // positive to increase, negative to decrease
  WriteArrayLine(arr: any[]): void    // joins with space, adds newline
  WriteLine(str: string): void
  Write(str: string): void
}
```

### ExternalLibs

```
LoadExternalLibraryFromUrl(libraryUrl: string): Promise<void>
```

## Color

```
class RGBColor {
  constructor(r: number, g: number, b: number)   // 0..255
  Set(r, g, b): void
  Clone(): RGBColor
}

class RGBAColor {
  constructor(r, g, b, a: number)                 // 0..255
  Set(r, g, b, a): void
  Clone(): RGBAColor
}

ColorComponentFromFloat(component: number): number    // float 0..1 → int 0..255
ColorComponentToFloat(component: number): number      // int 0..255 → float 0..1
RGBColorFromFloatComponents(r, g, b: number): RGBColor
SRGBToLinear(component: number): number
LinearToSRGB(component: number): number
IntegerToHexString(intVal: number): string            // 2-char hex
RGBColorToHexString(color: RGBColor): string          // 6-char hex, no #
RGBAColorToHexString(color: RGBAColor): string        // 8-char hex
HexStringToRGBColor(hexString: string): RGBColor|null
HexStringToRGBAColor(hexString: string): RGBAColor|null
ArrayToRGBColor(arr: number[3]): RGBColor
RGBColorIsEqual(a, b: RGBColor): boolean
```

## Model

### Unit

```
Unit = { Unknown: 0, Millimeter: 1, Centimeter: 2, Meter: 3, Inch: 4, Foot: 5 }
```

### Property

```
PropertyType = { Text: 1, Integer: 2, Number: 3, Boolean: 4, Percent: 5, Color: 6 }

class Property {
  constructor(type: PropertyType, name: string, value: any)
  Clone(): Property
}

class PropertyGroup {
  constructor(name: string)
  PropertyCount(): number
  AddProperty(property: Property): void
  GetProperty(index: number): Property
  Clone(): PropertyGroup
}

PropertyToString(property: Property): string|null
```

### Object3D / ModelObject3D

```
class Object3D {
  VertexCount(): number                    // 0
  VertexColorCount(): number               // 0
  NormalCount(): number                    // 0
  TextureUVCount(): number                 // 0
  LineCount(): number                      // 0
  LineSegmentCount(): number               // 0
  TriangleCount(): number                  // 0
  EnumerateVertices(onVertex: (Coord3D) => void): void
  EnumerateTriangleVertexIndices(cb: (v0, v1, v2: number) => void): void
  EnumerateTriangleVertices(cb: (v0, v1, v2: Coord3D) => void): void
}

class ModelObject3D extends Object3D {
  GetName(): string
  SetName(name: string): void
  PropertyGroupCount(): number
  AddPropertyGroup(pg: PropertyGroup): number
  GetPropertyGroup(index: number): PropertyGroup
  CloneProperties(target: ModelObject3D): void
}
```

### Material

```
MaterialType = { Phong: 1, Physical: 2 }
MaterialSource = { Model: 1, DefaultFace: 2, DefaultLine: 3 }

class TextureMap {
  name: string|null
  mimeType: string|null
  buffer: ArrayBuffer|null
  offset: Coord2D          // default (0,0)
  scale: Coord2D            // default (1,1)
  rotation: number           // radians, default 0
  IsValid(): boolean
  HasTransformation(): boolean
  IsEqual(rhs: TextureMap): boolean
}

class MaterialBase {
  type: MaterialType
  source: MaterialSource
  name: string
  color: RGBColor
  vertexColors: boolean
  IsEqual(rhs): boolean
}

class FaceMaterial extends MaterialBase {
  emissive: RGBColor
  opacity: number             // 0..1, default 1
  transparent: boolean
  diffuseMap: TextureMap|null
  bumpMap: TextureMap|null
  normalMap: TextureMap|null
  emissiveMap: TextureMap|null
  alphaTest: number           // 0..1
  multiplyDiffuseMap: boolean
}

class PhongMaterial extends FaceMaterial {
  // type = MaterialType.Phong
  ambient: RGBColor
  specular: RGBColor
  shininess: number           // 0..1
  specularMap: TextureMap|null
}

class PhysicalMaterial extends FaceMaterial {
  // type = MaterialType.Physical
  metalness: number           // 0..1, default 0
  roughness: number           // 0..1, default 1
  metalnessMap: TextureMap|null
}

TextureMapIsEqual(a, b: TextureMap|null): boolean
TextureIsEqual(a, b): boolean
```

### Triangle

```
class Triangle {
  constructor(v0, v1, v2: number)       // vertex indices
  v0, v1, v2: number
  c0, c1, c2: number|null              // vertex color indices
  n0, n1, n2: number|null              // normal indices
  u0, u1, u2: number|null              // UV indices
  mat: number|null                      // material index
  curve: number|null                    // smoothing group
  HasVertices(): boolean
  HasVertexColors(): boolean
  HasNormals(): boolean
  HasTextureUVs(): boolean
  SetVertices(v0, v1, v2): this
  SetVertexColors(c0, c1, c2): this
  SetNormals(n0, n1, n2): this
  SetTextureUVs(u0, u1, u2): this
  SetMaterial(mat: number): this
  SetCurve(curve: number): this
  Clone(): Triangle
}
```

### Line

```
class Line {
  constructor(vertices: number[])       // vertex indices
  HasVertices(): boolean
  GetVertices(): number[]
  SetMaterial(mat: number): this
  SegmentCount(): number
  Clone(): Line
}
```

### Mesh (extends ModelObject3D)

```
class Mesh extends ModelObject3D {
  VertexCount(): number
  VertexColorCount(): number
  NormalCount(): number
  TextureUVCount(): number
  LineCount(): number
  LineSegmentCount(): number
  TriangleCount(): number
  AddVertex(vertex: Coord3D): number
  SetVertex(index, vertex): void
  GetVertex(index): Coord3D
  AddVertexColor(color: RGBColor): number
  SetVertexColor(index, color): void
  GetVertexColor(index): RGBColor
  AddNormal(normal: Coord3D): number
  SetNormal(index, normal): void
  GetNormal(index): Coord3D
  AddTextureUV(uv: Coord2D): number
  SetTextureUV(index, uv): void
  GetTextureUV(index): Coord2D
  AddLine(line: Line): number
  GetLine(index): Line
  AddTriangle(triangle: Triangle): number
  GetTriangle(index): Triangle
  EnumerateVertices(onVertex): void
  EnumerateTriangleVertexIndices(cb): void
  EnumerateTriangleVertices(cb): void
  Clone(): Mesh
}
```

### MeshInstance

```
class MeshInstanceId {
  constructor(nodeId: number, meshIndex: number)
  nodeId: number
  meshIndex: number
  IsEqual(rhs): boolean
  GetKey(): string
}

class MeshInstance extends ModelObject3D {
  constructor(id: MeshInstanceId, node: Node, mesh: Mesh)
  GetId(): MeshInstanceId
  GetTransformation(): Transformation
  GetMesh(): Mesh
  GetTransformedMesh(): Mesh            // cloned + transformed
  // delegates counts/enumerations to mesh, applies world transformation
}
```

### Node

```
class Node {
  constructor()
  GetId(): number
  GetName(): string
  SetName(name: string): void
  HasParent(): boolean
  GetParent(): Node|null
  GetTransformation(): Transformation
  GetWorldTransformation(): Transformation
  SetTransformation(transformation: Transformation): void
  AddChildNode(node: Node): number
  RemoveChildNode(node: Node): void
  GetChildNodes(): Node[]
  ChildNodeCount(): number
  GetChildNode(index): Node
  AddMeshIndex(index: number): number
  MeshIndexCount(): number
  GetMeshIndex(index): number
  GetMeshIndices(): number[]
  IsEmpty(): boolean
  IsMeshNode(): boolean                 // no children, exactly 1 mesh
  Enumerate(processor: (Node) => void): void          // self + all descendants
  EnumerateChildren(processor: (Node) => void): void  // descendants only
  EnumerateMeshIndices(processor: (number) => void): void  // recursive
}
```

### Model (extends ModelObject3D)

```
class Model extends ModelObject3D {
  constructor()
  GetUnit(): Unit
  SetUnit(unit: Unit): void
  GetRootNode(): Node
  NodeCount(): number                   // excludes root
  MaterialCount(): number
  MeshCount(): number
  MeshInstanceCount(): number
  VertexCount(): number                 // across all instances
  VertexColorCount(): number
  NormalCount(): number
  TextureUVCount(): number
  LineCount(): number
  LineSegmentCount(): number
  TriangleCount(): number
  AddMaterial(material: MaterialBase): number
  GetMaterial(index: number): MaterialBase
  AddMesh(mesh: Mesh): number
  AddMeshToRootNode(mesh: Mesh): number
  RemoveMesh(index: number): void       // updates all node references
  GetMesh(index: number): Mesh
  GetMeshInstance(instanceId: MeshInstanceId): MeshInstance|null
  EnumerateMeshes(onMesh: (Mesh) => void): void
  EnumerateMeshInstances(onMeshInstance: (MeshInstance) => void): void
  EnumerateTransformedMeshInstances(onMesh: (Mesh) => void): void
  EnumerateVertices(onVertex): void
  EnumerateTriangleVertexIndices(cb): void
  EnumerateTriangleVertices(cb): void
}
```

### Model Utilities

```
IsEmptyMesh(mesh: Mesh): boolean
CalculateTriangleNormal(v0, v1, v2: Coord3D): Coord3D
TransformMesh(mesh: Mesh, transformation: Transformation): void   // modifies in place
FlipMeshTrianglesOrientation(mesh: Mesh): void

IsModelEmpty(model: Model): boolean
GetBoundingBox(object3D: Object3D): Box3D|null
GetTopology(object3D: Object3D): Topology
IsTwoManifold(object3D: Object3D|Model): boolean
GetDefaultMaterials(model: Model): MaterialBase[]
ReplaceDefaultMaterialsColor(model: Model, color: RGBColor, lineColor: RGBColor): void

FinalizeModel(model: Model, params?: { defaultLineMaterialColor?: RGBColor, defaultMaterialColor?: RGBColor }): void
CheckModel(model: Model): boolean     // validates all indices/values
```

### Quantities

```
GetTriangleArea(v0, v1, v2: Coord3D): number
GetTetrahedronSignedVolume(v0, v1, v2: Coord3D): number
CalculateVolume(object3D: Object3D|Model): number
CalculateSurfaceArea(object3D: Object3D): number
```

### Topology

```
class TopologyVertex { edges: number[]; triangles: number[] }
class TopologyEdge { vertex1: number; vertex2: number; triangles: number[] }
class TopologyTriangleEdge { edge: number; reversed: boolean }
class TopologyTriangle { triEdge1, triEdge2, triEdge3: number|null }

class Topology {
  vertices: TopologyVertex[]
  edges: TopologyEdge[]
  triangleEdges: TopologyTriangleEdge[]
  triangles: TopologyTriangle[]
  AddVertex(): number
  AddTriangle(vertex1, vertex2, vertex3: number): void
}
```

### MeshBuffer

```
class MeshPrimitiveBuffer {
  indices: number[]; vertices: number[]; colors: number[]; normals: number[]; uvs: number[]
  material: number|null
  GetBounds(): { min: number[3], max: number[3] }
  GetByteLength(indexTypeSize, numberTypeSize): number
}

class MeshBuffer {
  PrimitiveCount(): number
  GetPrimitive(index): MeshPrimitiveBuffer
  GetByteLength(indexTypeSize, numberTypeSize): number
}

ConvertMeshToMeshBuffer(mesh: Mesh): MeshBuffer|null
```

### Generator

```
class GeneratorParams {
  SetName(name: string): this
  SetMaterial(material: number): this
}

class Generator {
  constructor(params?: GeneratorParams)
  GetMesh(): Mesh
  AddVertex(x, y, z): number
  AddVertices(vertices: Coord3D[]): number[]
  SetCurve(curve: number): void
  ResetCurve(): void
  AddTriangle(v0, v1, v2): number
  AddTriangleInverted(v0, v1, v2): void
  AddConvexPolygon(vertices: number[]): void
  AddConvexPolygonInverted(vertices: number[]): void
}

class GeneratorHelper {
  constructor(generator: Generator)
  GenerateSurfaceBetweenPolygons(startIndices, endIndices: number[]): void
  GenerateTriangleFan(startIndices: number[], endIndex: number): void
}

GenerateCuboid(genParams, xSize, ySize, zSize): Mesh|null
GenerateCone(genParams, topRadius, bottomRadius, height, segments, smooth): Mesh|null
GenerateCylinder(genParams, radius, height, segments, smooth): Mesh|null
GenerateSphere(genParams, radius, segments, smooth): Mesh|null
GeneratePlatonicSolid(genParams, type: 'tetrahedron'|'hexahedron'|'octahedron'|'dodecahedron'|'icosahedron', radius): Mesh|null
```

## Import

### ImportSettings

```
class ImportSettings {
  defaultLineColor: RGBColor    // default (100,100,100)
  defaultColor: RGBColor        // default (200,200,200)
}
```

### ImportResult / ImportError

```
ImportErrorCode = { NoImportableFile: 1, FailedToLoadFile: 2, ImportFailed: 3, UnknownError: 4 }

class ImportError {
  code: ImportErrorCode
  mainFile: string|null
  message: string|null
}

class ImportResult {
  model: Model|null
  mainFile: string|null
  upVector: Direction|null
  usedFiles: string[]|null
  missingFiles: string[]|null
}
```

### InputFile / ImporterFile

```
class InputFile {
  constructor(name: string, source: FileSource, data: string|File)
}

InputFilesFromUrls(urls: string[]): InputFile[]
InputFilesFromFileObjects(fileObjects: File[]): InputFile[]
```

### Importer

```
class Importer {
  constructor()
  AddImporter(importer: ImporterBase): void
  ImportFiles(inputFiles: InputFile[], settings: ImportSettings, callbacks: {
    onLoadStart(),
    onFileListProgress(current, total),
    onFileLoadProgress(current, total),
    onImportStart(),
    onSelectMainFile?(fileNames: string[], selectFile: (index: number|null) => void),
    onImportSuccess(result: ImportResult),
    onImportError(error: ImportError)
  }): void
  GetFileList(): ImporterFileList
}
```

### ImporterBase (abstract)

```
class ImporterBase {
  Import(name, extension, content: ArrayBuffer, callbacks): void
  CanImportExtension(extension: string): boolean
  GetUpDirection(): Direction
  GetModel(): Model
  GetErrorMessage(): string|null
  Clear(): void
}
```

### Supported importers (each extends ImporterBase)

| Class | Extensions |
|---|---|
| ImporterObj | obj |
| ImporterStl | stl |
| ImporterOff | off |
| ImporterPly | ply |
| Importer3ds | 3ds |
| ImporterGltf | gltf, glb |
| ImporterBim | bim |
| Importer3dm | 3dm |
| ImporterIfc | ifc |
| ImporterOcct | stp, step, igs, iges, brp, brep |
| ImporterFcstd | fcstd |
| ImporterThreeFbx | fbx |
| ImporterThreeDae | dae |
| ImporterThreeWrl | wrl |
| ImporterThree3mf | 3mf |
| ImporterThreeAmf | amf |
| ImporterThreeSvg | svg |

### Importer Utilities

```
NameFromLine(line, startIndex, commentChar): string
ParametersFromLine(line, commentChar): string[]
ReadLines(str, onLine: (string) => void): void
IsPowerOfTwo(x): boolean
NextPowerOfTwo(x): number
UpdateMaterialTransparency(material: FaceMaterial): void   // sets transparent based on opacity
CreateOcctWorker(): Promise<Worker>
LoadExternalLibrary(libraryName: 'rhino3dm'|'webifc'|'draco3d'): Promise<void>

class ColorToMaterialConverter {
  constructor(model: Model)
  GetMaterialIndex(r, g, b: number, a?: number): number  // creates PhongMaterial if new color
}
```

## Export

### ExportedFile

```
class ExportedFile {
  constructor(name: string)
  GetName(): string
  SetName(name: string): void
  GetTextContent(): string
  GetBufferContent(): ArrayBuffer
  SetTextContent(content: string): void
  SetBufferContent(content: ArrayBuffer): void
}
```

### ExporterBase (abstract)

```
class ExporterBase {
  CanExport(format: FileFormat, extension: string): boolean
  Export(exporterModel: ExporterModel, format: FileFormat, onFinish: (files: ExportedFile[]) => void): void
}
```

### ExporterSettings / ExporterModel

```
class ExporterSettings {
  constructor(settings?: { transformation?: Transformation, isMeshVisible?: (MeshInstanceId) => boolean })
  transformation: Transformation
  isMeshVisible: (MeshInstanceId) => boolean
}

class ExporterModel {
  constructor(model: Model, settings?: ExporterSettings)
  GetModel(): Model
  MaterialCount(): number
  GetMaterial(index): MaterialBase
  VertexCount(): number
  TriangleCount(): number
  MeshCount(): number
  EnumerateMeshes(onMesh: (Mesh) => void): void
  MapMeshIndex(meshIndex: number): number       // visible mesh index mapping
  IsMeshInstanceVisible(id: MeshInstanceId): boolean
  EnumerateMeshInstances(cb: (MeshInstance) => void): void
  EnumerateTransformedMeshInstances(onMesh: (Mesh) => void): void
  EnumerateVerticesAndTriangles(callbacks: { onVertex(x,y,z), onTriangle(v0,v1,v2) }): void
  EnumerateTrianglesWithNormals(cb: (v0, v1, v2: Coord3D, normal: Coord3D) => void): void
}
```

### Exporter (dispatcher)

```
class Exporter {
  constructor()    // registers all built-in exporters
  AddExporter(exporter: ExporterBase): void
  Export(model: Model, settings: ExporterSettings, format: FileFormat, extension: string, callbacks: {
    onSuccess(files: ExportedFile[]),
    onError()
  }): void
}
```

### Supported exporters

| Class | Format | Extension |
|---|---|---|
| ExporterObj | Text | obj |
| ExporterStl | Text/Binary | stl |
| ExporterPly | Text/Binary | ply |
| ExporterOff | Text | off |
| ExporterGltf | Text (gltf) / Binary (glb) | gltf, glb |
| Exporter3dm | Binary | 3dm |
| ExporterBim | Text | bim |

## Viewer

### Camera

```
NavigationMode = { FixedUpVector: 1, FreeOrbit: 2 }
ProjectionMode = { Perspective: 1, Orthographic: 2 }

class Camera {
  constructor(eye: Coord3D, center: Coord3D, up: Coord3D, fov: number)  // fov in degrees
  eye: Coord3D; center: Coord3D; up: Coord3D; fov: number
  Clone(): Camera
}
CameraIsEqual3D(a, b: Camera): boolean
```

### EdgeSettings

```
class EdgeSettings {
  constructor(showEdges: boolean, edgeColor: RGBColor, edgeThreshold: number)  // threshold in degrees
  showEdges: boolean
  edgeColor: RGBColor
  edgeThreshold: number
  Clone(): EdgeSettings
}
```

### EnvironmentSettings

```
class EnvironmentSettings {
  constructor(textureNames: string[6]|null, backgroundIsEnvMap: boolean)
  // textureNames: [posx, negx, posy, negy, posz, negz] urls
  Clone(): EnvironmentSettings
}
```

### Viewer (low-level Three.js viewer)

```
class Viewer {
  Init(canvas: HTMLCanvasElement): void
  SetMouseClickHandler(cb: (button, mouseCoords) => void): void
  SetMouseMoveHandler(cb: (mouseCoords) => void): void
  SetContextMenuHandler(cb: (globalCoords, localCoords) => void): void
  SetEdgeSettings(edgeSettings: EdgeSettings): void
  SetEnvironmentMapSettings(settings: EnvironmentSettings): void
  SetBackgroundColor(color: RGBAColor): void
  GetCanvas(): HTMLCanvasElement
  GetCamera(): Camera
  SetCamera(camera: Camera): void
  GetProjectionMode(): ProjectionMode
  SetProjectionMode(mode: ProjectionMode): void
  Resize(width, height: number): void
  FitSphereToWindow(boundingSphere: THREE.Sphere|null, animation: boolean): void
  AdjustClippingPlanes(): void
  AdjustClippingPlanesToSphere(boundingSphere: THREE.Sphere|null): void
  GetNavigationMode(): NavigationMode
  SetNavigationMode(mode: NavigationMode): void
  SetUpVector(upDirection: Direction, animate: boolean): void
  FlipUpVector(): void
  Render(): void
  SetMainObject(object: THREE.Object3D): void
  AddExtraObject(object: THREE.Object3D): void
  Clear(): void
  ClearExtra(): void
  SetMeshesVisibility(isVisible: (userData) => boolean): void
  SetMeshesHighlight(highlightColor: RGBColor, isHighlighted: (userData) => boolean): void
  GetMeshUserDataUnderMouse(intersectionMode: IntersectionMode, mouseCoords: Coord2D): object|null
  GetMeshIntersectionUnderMouse(intersectionMode, mouseCoords): THREE.Intersection|null
  GetBoundingBox(needToProcess: (userData) => boolean): THREE.Box3|null
  GetBoundingSphere(needToProcess: (userData) => boolean): THREE.Sphere|null
  EnumerateMeshesAndLinesUserData(enumerator: (userData) => void): void
  GetImageSize(): { width, height }
  GetCanvasSize(): { width, height }
  GetImageAsDataUrl(width, height, isTransparent: boolean): string
  Destroy(): void
}

IntersectionMode = { MeshOnly: 1, MeshAndLine: 2 }

GetDefaultCamera(direction: Direction): Camera
TraverseThreeObject(object, processor: (obj) => boolean): boolean  // return false to stop
GetShadingTypeOfObject(mainObject): ShadingType|null
```

### EmbeddedViewer (high-level)

```
class EmbeddedViewer {
  constructor(parentElement: HTMLElement, parameters?: {
    camera?: Camera,
    projectionMode?: ProjectionMode,
    backgroundColor?: RGBAColor,
    defaultColor?: RGBColor,
    defaultLineColor?: RGBColor,
    edgeSettings?: EdgeSettings,
    environmentSettings?: EnvironmentSettings,
    onModelLoaded?: () => void,
    onModelLoadFailed?: () => void
  })
  LoadModelFromUrlList(modelUrls: string[]): void
  LoadModelFromFileList(fileList: File[]): void
  LoadModelFromInputFiles(inputFiles: InputFile[]): void
  GetViewer(): Viewer
  GetModel(): Model|null
  Resize(): void
  Destroy(): void
}

Init3DViewerFromUrlList(parentElement, modelUrls: string[], parameters?): EmbeddedViewer
Init3DViewerFromFileList(parentElement, models: File[], parameters?): EmbeddedViewer
Init3DViewerElements(onReady?): EmbeddedViewer[]   // scans DOM for class="online_3d_viewer"
```

## Three.js Conversion

### ThreeModelLoader

```
class ThreeModelLoader {
  constructor()
  InProgress(): boolean
  LoadModel(inputFiles: InputFile[], settings: ImportSettings, callbacks: {
    onLoadStart(),
    onFileListProgress(current, total),
    onFileLoadProgress(current, total),
    onImportStart(),
    onSelectMainFile?(fileNames, selectFile),
    onVisualizationStart(),
    onModelFinished(importResult: ImportResult, threeObject: THREE.Object3D),
    onTextureLoaded(),
    onLoadError(importError: ImportError)
  }): void
  GetImporter(): Importer
  GetDefaultMaterials(): THREE.Material[]|null
  ReplaceDefaultMaterialsColor(defaultColor: RGBColor, defaultLineColor: RGBColor): void
  Destroy(): void
}
```

### Three.js Utilities

```
ShadingType = { Phong: 1, Physical: 2 }

HasHighpDriverIssue(): boolean
GetShadingType(model: Model): ShadingType
ConvertThreeColorToColor(threeColor: THREE.Color): RGBColor
ConvertColorToThreeColor(color: RGBColor): THREE.Color
ConvertThreeGeometryToMesh(threeGeometry, materialIndex: number|null, colorConverter: ThreeColorConverter|null): Mesh
CreateHighlightMaterial(originalMaterial, highlightColor: RGBColor, withPolygonOffset: boolean): THREE.Material
CreateHighlightMaterials(originalMaterials, highlightColor, withPolygonOffset): THREE.Material[]
DisposeThreeObjects(mainObject: THREE.Object3D|null): void
GetLineSegmentsProjectedDistance(camera, canvasWidth, canvasHeight, lineSegments, screenPoint: Coord2D): number

class ThreeColorConverter { Convert(color: THREE.Color): THREE.Color|null }
class ThreeLinearToSRGBColorConverter extends ThreeColorConverter {}
class ThreeSRGBToLinearColorConverter extends ThreeColorConverter {}
```

### ConvertModelToThreeObject

```
MaterialGeometryType = { Line: 1, Face: 2 }

class ModelToThreeConversionParams {
  forceMediumpForMaterials: boolean   // default false
}

class ModelToThreeConversionOutput {
  defaultMaterials: THREE.Material[]
  objectUrls: string[]
}

ConvertModelToThreeObject(
  model: Model,
  conversionParams: ModelToThreeConversionParams,
  conversionOutput: ModelToThreeConversionOutput,
  callbacks: { onTextureLoaded(), onModelLoaded(threeObject: THREE.Object3D) }
): void
```

## Parameters / URL Handling

### ParameterConverter (static methods)

```
ParameterConverter.IntegerToString(n): string
ParameterConverter.StringToInteger(s): number
ParameterConverter.NumberToString(n): string       // 5 decimal precision
ParameterConverter.StringToNumber(s): number
ParameterConverter.ModelUrlsToString(urls): string|null
ParameterConverter.StringToModelUrls(str): string[]|null
ParameterConverter.CameraToString(camera): string|null
ParameterConverter.StringToCamera(str): Camera|null
ParameterConverter.ProjectionModeToString(pm): string|null
ParameterConverter.StringToProjectionMode(str): ProjectionMode|null
ParameterConverter.RGBColorToString(color): string|null
ParameterConverter.StringToRGBColor(str): RGBColor|null
ParameterConverter.RGBAColorToString(color): string|null
ParameterConverter.StringToRGBAColor(str): RGBAColor|null
ParameterConverter.EdgeSettingsToString(es): string|null
ParameterConverter.StringToEdgeSettings(str): EdgeSettings|null
ParameterConverter.EnvironmentSettingsToString(es): string|null
ParameterConverter.StringToEnvironmentSettings(str): object|null
```

### ParameterListBuilder / Parser

```
class ParameterListBuilder {
  constructor(separator: string)
  AddModelUrls(urls): this
  AddCamera(camera): this
  AddProjectionMode(pm): this
  AddEnvironmentSettings(es): this
  AddBackgroundColor(bg: RGBAColor): this
  AddDefaultColor(color: RGBColor): this
  AddDefaultLineColor(color: RGBColor): this
  AddEdgeSettings(es): this
  GetParameterList(): string
}

class ParameterListParser {
  constructor(paramList: string, separator: string)
  GetModelUrls(): string[]|null
  GetCamera(): Camera|null
  GetProjectionMode(): ProjectionMode|null
  GetEnvironmentSettings(): object|null
  GetBackgroundColor(): RGBAColor|null
  GetDefaultColor(): RGBColor|null
  GetDefaultLineColor(): RGBColor|null
  GetEdgeSettings(): EdgeSettings|null
}

CreateUrlBuilder(): ParameterListBuilder          // separator '$'
CreateUrlParser(urlParams: string): ParameterListParser
CreateModelUrlParameters(urls: string[]): string
```

## DOM Utilities

```
GetIntegerFromStyle(parameter: string): number
GetDomElementExternalWidth(style: CSSStyleDeclaration): number
GetDomElementExternalHeight(style): number
GetDomElementInnerDimensions(element, outerWidth, outerHeight): { width, height }
GetDomElementClientCoordinates(element, clientX, clientY): Coord2D
CreateDomElement(elementType, className?, innerHTML?): HTMLElement
AddDomElement(parentElement, elementType, className?, innerHTML?): HTMLElement
AddDiv(parentElement, className?, innerHTML?): HTMLElement
ClearDomElement(element): void
InsertDomElementBefore(newElement, existingElement): void
InsertDomElementAfter(newElement, existingElement): void
ShowDomElement(element, show: boolean): void
IsDomElementVisible(element): boolean
SetDomElementWidth(element, width: number): void
SetDomElementHeight(element, height: number): void
GetDomElementOuterWidth(element): number
GetDomElementOuterHeight(element): number
SetDomElementOuterWidth(element, width): void
SetDomElementOuterHeight(element, height): void
CreateDiv(className?, innerHTML?): HTMLElement
```

## Navigation

```
NavigationType = { None: 0, Orbit: 1, Pan: 2, Zoom: 3 }

class Navigation {
  constructor(canvas: HTMLElement, camera: Camera, callbacks: { onUpdate() })
  SetMouseClickHandler(cb): void
  SetMouseMoveHandler(cb): void
  SetContextMenuHandler(cb): void
  GetNavigationMode(): NavigationMode
  SetNavigationMode(mode: NavigationMode): void
  GetCamera(): Camera
  SetCamera(camera: Camera): void
  MoveCamera(newCamera: Camera, stepCount: number): void    // 0 = instant
  GetFitToSphereCamera(center: Coord3D, radius: number): Camera|null
}

class MouseInteraction {
  Down(canvas, ev): void
  Move(canvas, ev): void
  Up(canvas, ev): void
  IsButtonDown(): boolean
  GetButton(): number
  GetPosition(): Coord2D
  GetMoveDiff(): Coord2D
}

class TouchInteraction {
  Start(canvas, ev): void
  Move(canvas, ev): void
  End(canvas, ev): void
  IsFingerDown(): boolean
  GetFingerCount(): number
  GetPosition(): Coord2D
  GetMoveDiff(): Coord2D
  GetDistanceDiff(): number
}

class ClickDetector {
  Start(startPosition: Coord2D): void
  Move(currentPosition: Coord2D): void
  End(): void
  Cancel(): void
  IsClick(): boolean
}
```
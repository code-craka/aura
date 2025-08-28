/**
 * Context Management Interfaces
 * Defines the core interfaces for browser context extraction and management
 */

export interface ContextManager {
  extractContext(options: ExtractionOptions): Promise<BrowserContext>;
  filterSensitiveData(content: string): Promise<FilteredContent>;
  generateEmbeddings(content: string[]): Promise<VectorEmbedding[]>;
  searchSimilar(query: string, limit: number): Promise<ContextMatch[]>;
  updateContext(tabId: string, content: PageContent): Promise<void>;
}

export interface ExtractionOptions {
  includeMetadata?: boolean;
  includeImages?: boolean;
  includeScripts?: boolean;
  maxDepth?: number;
  respectRobots?: boolean;
  privacyMode?: boolean;
}

export interface BrowserContext {
  activeTab: TabContext;
  relatedTabs: TabContext[];
  userActivity: ActivityContext;
  temporalContext: TemporalContext;
  extractedAt: Date;
  sessionId: string;
}

export interface TabContext {
  id: string;
  url: string;
  title: string;
  content: PageContent;
  metadata: TabMetadata;
  relationships: TabRelationship[];
}

export interface PageContent {
  text: string;
  html: string;
  structuredData: StructuredData[];
  images: ImageData[];
  links: LinkData[];
  forms: FormData[];
}

export interface StructuredData {
  type: string;
  schema: string;
  data: Record<string, any>;
  confidence: number;
}

export interface ImageData {
  src: string;
  alt: string;
  caption?: string;
  metadata: ImageMetadata;
}

export interface LinkData {
  href: string;
  text: string;
  type: LinkType;
  metadata: LinkMetadata;
}

export interface FormData {
  action: string;
  method: string;
  fields: FormField[];
  metadata: FormMetadata;
}

export interface FormField {
  name: string;
  type: string;
  label?: string;
  required: boolean;
  value?: string;
}

export interface TabMetadata {
  domain: string;
  language: string;
  contentType: string;
  lastModified?: Date;
  loadTime: number;
  securityLevel: SecurityLevel;
}

export interface TabRelationship {
  targetTabId: string;
  type: RelationshipType;
  strength: number;
  evidence: string[];
}

export interface ActivityContext {
  scrollPosition: number;
  timeOnPage: number;
  interactions: UserInteraction[];
  focusEvents: FocusEvent[];
}

export interface UserInteraction {
  type: InteractionType;
  element: string;
  timestamp: Date;
  data?: Record<string, any>;
}

export interface FocusEvent {
  element: string;
  timestamp: Date;
  duration: number;
}

export interface TemporalContext {
  sessionStart: Date;
  lastActivity: Date;
  browsingHistory: HistoryEntry[];
  patterns: BrowsingPattern[];
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitTime: Date;
  duration: number;
}

export interface BrowsingPattern {
  type: PatternType;
  frequency: number;
  confidence: number;
  description: string;
}

export interface FilteredContent {
  content: string;
  removedItems: SensitiveItem[];
  privacyLevel: PrivacyLevel;
  anonymizationMap?: Map<string, string>;
}

export interface SensitiveItem {
  type: SensitiveDataType;
  value: string;
  location: ContentLocation;
  confidence: number;
}

export interface ContentLocation {
  start: number;
  end: number;
  context: string;
}

export interface VectorEmbedding {
  id: string;
  content: string;
  embedding: number[];
  metadata: VectorMetadata;
  source: ContextSource;
  timestamp: Date;
}

export interface VectorMetadata {
  contentType: string;
  language: string;
  domain: string;
  quality: number;
  tags: string[];
}

export interface ContextSource {
  type: SourceType;
  tabId?: string;
  url?: string;
  element?: string;
}

export interface ContextMatch {
  embedding: VectorEmbedding;
  similarity: number;
  relevanceScore: number;
  explanation: string;
}

// Enums
export enum LinkType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  ANCHOR = 'anchor',
  DOWNLOAD = 'download'
}

export enum SecurityLevel {
  SECURE = 'secure',
  MIXED = 'mixed',
  INSECURE = 'insecure'
}

export enum RelationshipType {
  REFERENCE = 'reference',
  CONTINUATION = 'continuation',
  COMPARISON = 'comparison',
  RELATED_TOPIC = 'related_topic'
}

export enum InteractionType {
  CLICK = 'click',
  SCROLL = 'scroll',
  HOVER = 'hover',
  INPUT = 'input',
  SELECTION = 'selection'
}

export enum PatternType {
  RESEARCH = 'research',
  SHOPPING = 'shopping',
  WORK = 'work',
  ENTERTAINMENT = 'entertainment'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export enum SensitiveDataType {
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  ADDRESS = 'address',
  NAME = 'name',
  PASSWORD = 'password',
  API_KEY = 'api_key'
}

export enum SourceType {
  TAB_CONTENT = 'tab_content',
  USER_INPUT = 'user_input',
  FORM_DATA = 'form_data',
  METADATA = 'metadata'
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface LinkMetadata {
  domain: string;
  isExternal: boolean;
  trustScore: number;
}

export interface FormMetadata {
  isSecure: boolean;
  hasValidation: boolean;
  purpose: string;
}
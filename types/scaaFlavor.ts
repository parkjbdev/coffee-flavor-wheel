export interface ScaaFlavor {
  meta: Meta
  data: FlavorData[]
}

export interface Meta {
  maxDepth: number
  name: string
  type: string
  faults: boolean
  author: string
  date: string
  languages: string[]
  source: string
  notes: string[]
}

export interface FlavorData {
  name: string
  colour: string
  definition?: string
  references?: Reference[]
  children?: FlavorData[]
  fundamental?: boolean
  image?: string
  icon?: string
}

export interface Reference {
  reference: string
  flavor?: number
  flavor_preparation?: string
  aroma?: number
  aroma_preparation?: string
}

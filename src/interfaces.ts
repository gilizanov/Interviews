export interface IInterview {
  id: string
  company: string
  vacancyLink: string
  hrName: string
  contactTelegram?: string
  contactWhatsApp?: string
  contactPhone?: string
  createdAt: Date
  salaryFrom?: number
  salaryTo?: number
  stageName?: string
  stages?: IStage[]
  result?: 'Refusal' | 'Offer'
}

export interface IStage {
  id?: number
  name: string
  date: null | Date
  description: string
}

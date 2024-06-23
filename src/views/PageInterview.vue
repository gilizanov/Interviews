<template>
  <app-progress v-if="isLoading" />
  <div v-else-if="interview?.id && !isLoading" class="interview-content">
    <app-card>
      <template #title>Собеседование в компанию {{ interview.company }}</template>
      <template #content>
        <div class="flex flex-column gap-2">
          <label for="company">Компания</label>
          <app-input-text class="input mb-3" id="company" v-model="interview.company" />
        </div>
        <div class="flex flex-column gap-2">
          <label for="vacancyLink">Описание вакансии (ссылка)</label>
          <app-input-text class="input mb-3" id="vacancyLink" v-model="interview.vacancyLink" />
        </div>
        <div class="flex flex-column gap-2">
          <label for="hrName">Контакт (имя)</label>
          <app-input-text class="input mb-3" id="hrName" v-model="interview.hrName" />
        </div>
        <div class="flex flex-column gap-2" title="Укажите ник Telegram без '@'">
          <label for="contactTelegram">Telegram username HR</label>
          <app-input-text
            class="input mb-3"
            id="contactTelegram"
            v-model="interview.contactTelegram"
          />
        </div>
        <div class="flex flex-column gap-2">
          <label for="contactWhatsApp">WhatsApp телефон HR</label>
          <app-input-text
            class="input mb-3"
            id="contactWhatsApp"
            v-maska
            data-maska="+7##########"
            v-model="interview.contactWhatsApp"
          />
        </div>
        <div class="flex flex-column gap-2">
          <label for="contactPhone">Телефон HR</label>
          <app-input-text
            class="input mb-3"
            id="contactPhone"
            v-maska
            data-maska="+7##########"
            v-model="interview.contactPhone"
          />
        </div>
        <div class="flex flex-wrap gap-3 p-fluid mb-3">
          <div class="flex-auto">
            <app-input-number
              inputId="salaryFrom"
              placeholder="Зарплатная вилка от"
              v-model="interview.salaryFrom"
            />
          </div>
          <div class="flex-auto">
            <app-input-number
              inputId="salaryTo"
              placeholder="Зарплатная вилка до"
              v-model="interview.salaryTo"
            />
          </div>
        </div>
        <app-button
          label="Добавить этап"
          severity="info"
          icon="pi pi-plus"
          class="mb-3"
          @click="addStage"
        />

        <template v-if="interview.stages">
          <div v-for="stage in interview.stages" :key="stage.id" class="interview-stage">
            <div class="flex flex-column gap-2">
              <label :for="`stage-name-${stage.id}`">Название этапа</label>
              <app-input-text
                class="input mb-3"
                :id="`stage-name-${stage.id}`"
                v-model="stage.name"
              />
            </div>
            <div class="flex flex-column gap-2">
              <label :for="`stage-date-${stage.id}`">Дата прохождения этапа</label>
              <app-calendar
                class="input mb-3"
                :id="`stage-date-${stage.id}`"
                date-format="dd.mm.yy"
                v-model="stage.date"
              />
            </div>
            <div class="flex flex-column gap-2">
              <label :for="`stage-description-${stage.id}`">Комментарий</label>
              <app-textarea
                :id="`stage-description-${stage.id}`"
                class="input mb-3"
                rows="5"
                v-model="stage.description"
              />
            </div>
            <app-button severity="danger" label="Удалить этап" @click="removeStage" />
          </div>
        </template>
        <div class="flex flex-wrap gap-3 mb-3">
          <div class="flex align-items-center">
            <app-radio
              inputId="interviewsResult1"
              name="result"
              value="Refusal"
              v-model="interview.result"
            />
            <label for="interviewsResult1" class="ml-2">Отказ</label>
          </div>
          <div class="flex align-items-center">
            <app-radio
              inputId="interviewsResult2"
              name="result"
              value="Offer"
              v-model="interview.result"
            />
            <label for="interviewsResult2" class="ml-2">Оффер</label>
          </div>
        </div>
        <app-button label="Сохранить" icon="pi pi-save" @click="saveInterview" />
      </template>
    </app-card>
  </div>
</template>

<script setup lang="ts">
import { vMaska } from 'maska'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getFirestore, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { useUserStore } from '@/stores/user'
import type { IInterview, IStage } from '@/interfaces'

const db = getFirestore()
const userStore = useUserStore()
const route = useRoute()

const isLoading = ref<boolean>(true)
const interview = ref<IInterview>()

const docref = doc(db, `users/${userStore.userId}/interviews`, route.params.id as string)

const getData = async (): Promise<void> => {
  isLoading.value = true
  const docSnap = await getDoc(docref)

  if (docSnap.exists()) {
    const data = docSnap.data() as IInterview

    if (data.stages && data.stages.length) {
      data.stages = data.stages.map((stage: IStage) => {
        if (stage.date && stage.date instanceof Timestamp) {
          return {
            ...stage,
            date: stage.date.toDate()
          }
        }
        return stage
      })
    }
    interview.value = data
  }
  isLoading.value = false
}

const saveInterview = async (): Promise<void> => {
  isLoading.value = true
  await updateDoc(docref, { ...interview.value })
  await getData()
  isLoading.value = false
}

const addStage = () => {
  if (interview.value) {
    if (!interview.value.stages) {
      interview.value.stages = []
    }

    const stageIndex = interview.value.stages.length + 1
    interview.value.stages.push({ id: stageIndex, name: '', date: null, description: '' })
  }
}

const removeStage = (index: number) => {
  if (interview.value) {
    if (interview.value.stages) {
      interview.value.stages.splice(index, 1)
    }
  }
}

onMounted(async () => await getData())
</script>

<style scoped>
.interview-content {
  max-width: 600px;
  margin: auto;
}
.input {
  width: 100%;
}
.interview-stage {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}
</style>

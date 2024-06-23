<template>
  <app-dialog />
  <app-progress v-if="isLoading" />
  <app-message v-else-if="!isLoading && !interviews.length" severity="info">
    Нет добавленных собеседований
  </app-message>
  <div v-else>
    <h1>Список собеседований</h1>
    <div class="flex align-items center mb-5 gap-3">
      <div class="flex align-items-center">
        <app-radio
          inputId="interviewsResult1"
          name="result"
          value="Refusal"
          v-model="selectedFilterResult"
        />
        <label for="interviewsResult1" class="ml-2">Отказ</label>
      </div>
      <div class="flex align-items-center">
        <app-radio
          inputId="interviewsResult2"
          name="result"
          value="Offer"
          v-model="selectedFilterResult"
        />
        <label for="interviewsResult2" class="ml-2">Оффер</label>
      </div>
      <app-button @click="submitFilter" :disabled="!selectedFilterResult">Применить</app-button>
      <app-button @click="clearFilter" :disabled="!selectedFilterResult" severity="danger">
        Сбросить
      </app-button>
    </div>
    <app-data-table :value="interviews">
      <app-column field="company" header="Компания"></app-column>
      <app-column field="hrName" header="Имя HR"></app-column>
      <app-column field="vacancyLink" header="Ссылка на вакансию">
        <template #body="slotProps">
          <a :href="slotProps.data.vacancyLink" target="_blank">Ссылка на вакансию</a>
        </template>
      </app-column>
      <app-column header="Контакты">
        <template #body="slotProps">
          <div class="contacts">
            <a
              v-if="slotProps.data.contactTelegram"
              :href="`https://t.me/${slotProps.data.contactTelegram}`"
              target="_blank"
              class="contacts__tg"
            >
              <span class="contacts__icon pi pi-telegram"></span>
            </a>
            <a
              v-if="slotProps.data.contactWhatsApp"
              :href="`https://wa.me/${slotProps.data.contactWhatsApp}`"
              target="_blank"
              class="contacts__whatsapp"
            >
              <span class="contacts__icon pi pi-whatsapp"></span>
            </a>
            <a
              v-if="slotProps.data.contactPhone"
              :href="`tel:${slotProps.data.contactPhone}`"
              target="_blank"
              class="contacts__phone"
            >
              <span class="contacts__icon pi pi-phone"></span>
            </a>
          </div>
        </template>
      </app-column>
      <app-column header="Пройденный этап">
        <template #body="slotProps">
          <span v-if="!slotProps.data.stages">Не заполнено</span>
          <div v-else class="interviews-stages">
            <app-badge
              v-for="(stage, index) in slotProps.data.stages"
              :key="index"
              :value="index + 1"
              rounded
              v-tooltip.top="stage.name"
            />
          </div>
        </template>
      </app-column>
      <app-column header="Зарплатная вилка">
        <template #body="slotProps">
          <span v-if="!slotProps.data.salaryFrom">Не заполнено</span>
          <span v-else-if="!slotProps.data.salaryTo">{{ slotProps.data.salaryFrom }}₽</span>
          <span v-else>{{ slotProps.data.salaryFrom }}₽ - {{ slotProps.data.salaryTo }}₽</span>
        </template>
      </app-column>
      <app-column header="Результат">
        <template #body="slotProps">
          <span v-if="!slotProps.data.result">Не заполнено</span>
          <template v-else>
            <app-badge
              :severity="slotProps.data.result === 'Offer' ? 'success' : 'danger'"
              :value="slotProps.data.result === 'Offer' ? 'Оффер' : 'Отказ'"
            />
          </template>
        </template>
      </app-column>
      <app-column>
        <template #body="slotProps">
          <div class="flex gap-2">
            <router-link
              class="p-button p-button-icon-only p-button-info"
              :to="{ name: 'Interview', params: { id: slotProps.data.id } }"
            >
              <span class="pi pi-pencil"></span>
            </router-link>
            <app-button
              icon="pi pi-trash"
              severity="danger"
              @click="confirmRemove(slotProps.data.id)"
            />
          </div>
        </template>
      </app-column>
    </app-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  where
} from 'firebase/firestore'
import { useUserStore } from '@/stores/user'
import type { IInterview } from '@/interfaces'
import { useConfirm } from 'primevue/useconfirm'

const userStore = useUserStore()
const db = getFirestore()
const confirm = useConfirm()

const interviews = ref<IInterview[]>([])
const isLoading = ref<boolean>(true)
const selectedFilterResult = ref<string>('')

const submitFilter = async (): Promise<void> => {
  isLoading.value = true
  const listIntervies: Array<IInterview> = await getAllInterviews(true)
  interviews.value = listIntervies
  isLoading.value = false
}

const clearFilter = async (): Promise<void> => {
  isLoading.value = true
  const listIntervies: Array<IInterview> = await getAllInterviews()
  interviews.value = listIntervies
  isLoading.value = false
}

const getAllInterviews = async <T extends IInterview>(isFilter?: boolean): Promise<T[]> => {
  let getData

  if (isFilter) {
    getData = query(
      collection(db, `users/${userStore.userId}/interviews`),
      orderBy('createdAt', 'desc'),
      where('result', '==', selectedFilterResult.value)
    )
  } else {
    getData = query(
      collection(db, `users/${userStore.userId}/interviews`),
      orderBy('createdAt', 'desc')
    )
  }

  const listDocs = await getDocs(getData)

  return listDocs.docs.map((doc) => doc.data() as T)
}

const confirmRemove = async (id: string): Promise<void> => {
  confirm.require({
    message: 'Вы хотите удалить собеседование?',
    header: 'Удаление собеседования',
    icon: 'pi pi-info-circle',
    rejectLabel: 'Отмена',
    acceptLabel: 'Удалить',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptClass: 'p-button-danger',
    accept: async () => {
      isLoading.value = true
      await deleteDoc(doc(db, `users/${userStore.userId}/interviews`, id))
      interviews.value = await getAllInterviews()
      isLoading.value = false
    }
  })
}

onMounted(async () => {
  const listInterviews: IInterview[] = await getAllInterviews()
  interviews.value = listInterviews
  isLoading.value = false
})
</script>

<style scoped>
.contacts {
  display: flex;
  align-items: center;
  gap: 24px;
}
.contacts__tg {
  color: #0088cc;
}
.contacts__whatsapp {
  color: #25d366;
}
.contacts__phone {
  color: #371777;
}
.contacts__icon {
  font-size: 20px;
}

.interviews-stages {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

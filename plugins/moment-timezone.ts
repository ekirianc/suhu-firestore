import moment from 'moment-timezone'
import {defineNuxtPlugin} from "#app";

export default defineNuxtPlugin(() => {
  moment.tz.setDefault('Asia/Singapore')
})
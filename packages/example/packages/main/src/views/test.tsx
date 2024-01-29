import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const count = ref(0)

    const handle = () => {
      count.value++
    }

    return () => {
      return <button onClick={handle}>{count.value}</button>
    }
  },
})

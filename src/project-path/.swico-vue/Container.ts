import { defineComponent, onErrorCaptured, ref } from 'vue';

export default defineComponent({
    name: 'Container',
    setup(props) {
        const error = ref<string | null>(null);
        onErrorCaptured((err) => {
            error.value = err.toString();
            return false;
        });

        return { error };
    },

    template: '<Layout v-if="!error"><RouterView /></Layout>'
});

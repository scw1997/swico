import { defineComponent } from 'vue';
import { useNav } from './hooks';

export default defineComponent({
    name: 'Link',
    props: {
        to: {
            required: true
        },
        replace: {
            type: Boolean
        }
    },
    setup(props) {
        const nav = useNav();
        return { nav };
    },

    template: `<a
        @click="
            () => {
                nav(to, { replace });
            }
        "
    >
        <slot></slot>
    </a>`
});

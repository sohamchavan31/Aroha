import React, { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Field from '../ui/Field';
import AnimatedPressable from '../AnimatedPressable';
import { Palette } from '../../constants/theme';
import { tap } from '../../utils/haptics';

// Password input with a show / hide eye.
const PasswordField = forwardRef(function PasswordField(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      ref={ref}
      icon="lock-closed-outline"
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      right={
        <AnimatedPressable
          onPress={() => { tap(); setVisible(v => !v); }}
          scaleTo={0.9}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={19} color={Palette.textSub} />
        </AnimatedPressable>
      }
    />
  );
});

export default PasswordField;

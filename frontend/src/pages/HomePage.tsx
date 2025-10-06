import { Stack, Text } from '@fluentui/react';

export const HomePage = () => {
  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 40 } }}>
      <Text variant="xxLarge">Welcome to Millennium Timber Roof ERP</Text>
      <Text variant="large">
        Use the navigation menu on the left to access different modules.
      </Text>
    </Stack>
  );
};

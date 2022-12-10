import { useEffect } from "react";
import {
  CircularProgress,
  TextField,
  Autocomplete,
  debounce,
} from "@mui/material";
import { useControlField, useField } from "remix-validated-form";
import type { SubmitOptions } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";

type ProfileValue = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
};

interface ProfilesSelectProps {
  name: string;
  label: string;
  helperText?: string;
}

const fetcherOptions: SubmitOptions = {
  method: "get",
  action: "/api/profiles-search",
};

export const ProjectOwnerField = ({
  name,
  label,
  helperText,
}: ProfilesSelectProps) => {
  const fetcher = useFetcher<ProfileValue[]>();
  const { error } = useField(name);
  const [value, setValue] = useControlField<ProfileValue>(name);
  const searchValues = (value: string) => {
    fetcher.submit({ q: value }, fetcherOptions);
  };
  const searchValuesDebounced = debounce(searchValues, 500);

  useEffect(() => {
    if (fetcher.type === "init") {
      fetcher.submit({}, fetcherOptions);
    }
  }, [fetcher]);

  return (
    <>
      <input type="hidden" name={`${name}.id`} value={value?.id} />
      <Autocomplete
        options={fetcher.data ?? []}
        value={value}
        isOptionEqualToValue={(option, value) => option.name === value.name}
        getOptionLabel={(option) =>
          option.name || `${option.firstName} ${option.lastName}`
        }
        onInputChange={(_, value) => searchValuesDebounced(value)}
        onChange={(_e, newValue) => {
          if (newValue) {
            setValue(newValue);
          }
        }}
        filterSelectedOptions
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={!!error}
            helperText={error || helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {fetcher.state === "submitting" ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </>
  );
};

export default ProjectOwnerField;

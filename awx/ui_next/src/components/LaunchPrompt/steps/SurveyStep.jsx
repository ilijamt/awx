import React, { useState } from 'react';

import { t } from '@lingui/macro';
import { useField } from 'formik';
import {
  Form,
  FormGroup,
  Select,
  SelectOption,
  SelectVariant,
} from '@patternfly/react-core';
import FormField from '../../FormField';
import AnsibleSelect from '../../AnsibleSelect';
import Popover from '../../Popover';
import {
  required,
  minMaxValue,
  maxLength,
  minLength,
  integer,
  combine,
} from '../../../util/validators';
import { Survey } from '../../../types';

function SurveyStep({ surveyConfig }) {
  const fieldTypes = {
    text: TextField,
    textarea: TextField,
    password: TextField,
    multiplechoice: MultipleChoiceField,
    multiselect: MultiSelectField,
    integer: NumberField,
    float: NumberField,
  };
  return (
    <Form
      onSubmit={e => {
        e.preventDefault();
      }}
    >
      {surveyConfig.spec.map(question => {
        const Field = fieldTypes[question.type];
        return <Field key={question.variable} question={question} />;
      })}
    </Form>
  );
}
SurveyStep.propTypes = {
  surveyConfig: Survey.isRequired,
};

function TextField({ question }) {
  const validators = [
    question.required ? required(null) : null,
    question.required && question.min ? minLength(question.min) : null,
    question.required && question.max ? maxLength(question.max) : null,
  ];
  return (
    <FormField
      id={`survey-question-${question.variable}`}
      name={`survey_${question.variable}`}
      label={question.question_name}
      tooltip={question.question_description}
      isRequired={question.required}
      validate={combine(validators)}
      type={question.type}
      minLength={question.min}
      maxLength={question.max}
    />
  );
}

function NumberField({ question }) {
  const validators = [
    question.required ? required(null) : null,
    minMaxValue(question.min, question.max),
    question.type === 'integer' ? integer() : null,
  ];
  return (
    <FormField
      id={`survey-question-${question.variable}`}
      name={`survey_${question.variable}`}
      label={question.question_name}
      tooltip={question.question_description}
      isRequired={question.required}
      validate={combine(validators)}
      type="number"
      min={question.min}
      max={question.max}
    />
  );
}

function MultipleChoiceField({ question }) {
  const [field, meta] = useField(`survey_${question.variable}`);
  const id = `survey-question-${question.variable}`;
  const isValid = !(meta.touched && meta.error);
  return (
    <FormGroup
      fieldId={id}
      helperTextInvalid={meta.error}
      isRequired={question.required}
      validated={isValid ? 'default' : 'error'}
      label={question.question_name}
      labelIcon={<Popover content={question.question_description} />}
    >
      <AnsibleSelect
        id={id}
        isValid={isValid}
        {...field}
        data={question.choices.split('\n').map(opt => ({
          key: opt,
          value: opt,
          label: opt,
        }))}
      />
    </FormGroup>
  );
}

function MultiSelectField({ question }) {
  const [isOpen, setIsOpen] = useState(false);
  const [field, meta, helpers] = useField({
    name: `survey_${question.variable}`,
    validate: question.required ? required(null) : null,
  });
  const id = `survey-question-${question.variable}`;
  const hasActualValue = !question.required || meta.value?.length > 0;
  const isValid = !meta.touched || (!meta.error && hasActualValue);

  return (
    <FormGroup
      fieldId={id}
      helperTextInvalid={
        meta.error || t`At least one value must be selected for this field.`
      }
      isRequired={question.required}
      validated={isValid ? 'default' : 'error'}
      label={question.question_name}
      labelIcon={<Popover content={question.question_description} />}
    >
      <Select
        variant={SelectVariant.typeaheadMulti}
        id={id}
        onToggle={setIsOpen}
        onSelect={(event, option) => {
          if (field?.value?.includes(option)) {
            helpers.setValue(field.value.filter(o => o !== option));
          } else {
            helpers.setValue(field.value.concat(option));
          }
          helpers.setTouched(true);
        }}
        isOpen={isOpen}
        selections={field.value}
        onClear={() => {
          helpers.setTouched(true);
          helpers.setValue([]);
        }}
      >
        {question.choices.split('\n').map(opt => (
          <SelectOption key={opt} value={opt} />
        ))}
      </Select>
    </FormGroup>
  );
}

export default SurveyStep;

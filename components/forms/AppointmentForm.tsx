"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useController } from "react-hook-form";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createUser } from "@/lib/actions/patient.actions";
// import { AppointmentFormValidation } from "@/lib/validation"
import { getAppointmentSchema } from "@/lib/validation";

import CustomFormField from "../CustomFormField";

import SubmitButton from "../SubmitButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Doctors } from "@/constants";
import { SelectItem } from "@radix-ui/react-select";
import {
  createAppointment,
  updateAppointment,
} from "@/lib/actions/appointment.actions";
import { FormFieldType } from "@/components/forms/PatientForm";
import { Appointment } from "@/types/appwrite.types";
import { scheduler } from "timers/promises";

const AppointmentForm = ({
  userId,
  patientId,
  type,
  appointment,
  setOpen,
}: {
  userId: string;
  patientId: string;
  type: "create" | "cancel" | "schedule";
  appointment: Appointment;
  setOpen: (open: boolean) => void;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const AppointmentFormValidation = getAppointmentSchema(type);

  const form = useForm<z.infer<typeof AppointmentFormValidation>>({
    resolver: zodResolver(AppointmentFormValidation),
    defaultValues: {
      primaryPhysician: appointment ? appointment?.primaryPhysician : "",
      schedule: appointment
        ? new Date(appointment?.schedule!)
        : new Date(Date.now()),
      reason: appointment ? appointment.reason : "",
      note: appointment?.note || "",
      cancellationReason: appointment?.cancellationReason || "",
    },
  });

  async function onSubmit(values: z.infer<typeof AppointmentFormValidation>) {

    setIsLoading(true);

    let status;
    switch (type) {
      case "schedule":
        status = "scheduled";
        break;
      case "cancel":
        status = "cancelled";
        break;
      default:
        status = "pending";
        break;
    }

    try {
      if (type === 'create' && patientId) {
        const appointment = {
          userId,
          patient: patientId,
          primaryPhysician: values.primaryPhysician,
          schedule: new Date(values.schedule),
          reason: values.reason!,
          status: status as Status,
          note: values.note,
        };

        const newAppointment = await createAppointment(appointment);

        if (newAppointment) {
          form.reset();
          router.push(
            `/patients/${userId}/new-appointment/success?appointmentId=${newAppointment.$id}`
          );
        }
      } else {
        const appointmentToUpdate = {
          userId,
          appointmentId: appointment?.$id!,
          appointment: {
            primaryPhysician: values.primaryPhysician,
            schedule: new Date(values.schedule),
            status: status as Status,
            cancellationReason: values.cancellationReason,
          },
          type,
        };

        const updatedAppointment = await updateAppointment(appointmentToUpdate);

        if (updatedAppointment) {
          setOpen && setOpen(false);
          form.reset();
        }
      }

      // if (type === "create" && patientId) {
      //   const appointmentData = {
      //     userId,
      //     patient: patientId,
      //     primaryPhysician: values.primaryPhysician,
      //     schedule: new Date(values.schedule),
      //     reason: values.reason!,
      //     status: status as Status,
      //     note: values.note,
      //   };

      // } else {
      //   const appointmentToUpdate = {
      //     userId,
      //     appointmentId: appointment?.$id!,
      //     appointment: {
      //       primaryPhysician: values?.primaryPhysician,
      //       schedule: new Date(values?.schedule),
      //       status: status as Status,
      //       CancellationReason: values?.cancellationReason,
      //     },
      //     type,
      //   };
      // }

      // const updatedAppointment = await updateAppointment(appointmentToUpdate);      //   if (appointment) {
      // //     form.reset();
      // //     router.push(
      // //       `/patients/${userId}/new-appointment/success?appointmentId=${appointment.$id}`
      // //     );
      // //   }
      // // }
    } catch (error) {
      console.log(error);
    }

    setIsLoading(false);
  }

  let buttonLabel;
  switch (type) {
    case "cancel":
      buttonLabel = "Cancel Appointment";
      break;
    case "create":
      buttonLabel = "Create Appointment";
      break;
    case "schedule":
      buttonLabel = "schedule Appointment";
      break;
    default:
      break;
    //   buttonLabel = "Submit Apppointment";
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1">
        {type == "create" && 
          <section className="mb-12 space-y-4">
            <h1 className="header">New Appointment</h1>
            <p className="text-dark-700">Request new appointment in seconds</p>
          </section>
        }

        {type !== "cancel" && (
          <>
            {/* <CustomFormField
              fieldType={FormFieldType.SELECT}
              control={form.control}
              name="primaryPhysician"
              label="Primary Physician"
              placeholder="Select a physician"
            >
              {Doctors.map((doctor) => (
                <SelectItem key={doctor.name } value={doctor.name}>
                  <div className="flex cursor-pointer items-center gap-2">
                    <Image
                      src={doctor.image}
                      width={32}
                      height={32}
                      alt="doctor"
                      className="rounded-full border border-dark-500"
                    />
                    <p>{doctor.name}</p>
                  </div>
                </SelectItem>
              ))}
            </CustomFormField> */}

            {/* <select {...form.register("primaryPhysician")}>
            <option value="">Select a doctor</option>
            {Doctors.map((doctor, i) => (
            <option key={doctor.name + i} value={doctor.name}>
            {doctor.name}
            </option>
            ))}
            </select> */}

            <div className="relative">
              <select
                {...form.register("primaryPhysician")}
                className="appearance-none w-full bg-dark-400 border border-dark-500 text-dark-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-dark-300 focus:border-dark-600"
              >
                <option value="">Select a doctor</option>
                {Doctors.map((doctor, i) => (
                  <option
                    key={doctor.name + i}
                    value={doctor.name}
                    className="flex items-center gap-2 py-2"
                    style={{
                      backgroundImage: `url(${doctor.image})`,
                      backgroundSize: "20px 20px",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "5px center",
                      paddingLeft: "32px",
                    }}
                  >
                    {doctor.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-dark-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" />
                </svg>
              </div>
            </div>

            <CustomFormField
              fieldType={FormFieldType.DATE_PICKER}
              control={form.control}
              name="schedule"
              label="Expected appointment date"
              showTimeSelect
              dateFormat="MM/dd/yyyy  -  h:mm aa"
            />

            <div
              className={`flex flex-col gap-6  ${
                type === "create" && "xl:flex-row"
              }`}
            >
              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="reason"
                label="Appointment reason"
                placeholder="Annual montly check-up"
                disabled={type === "schedule"}
              />

              <CustomFormField
                fieldType={FormFieldType.TEXTAREA}
                control={form.control}
                name="note"
                label="Comments/notes"
                placeholder="Prefer afternoon appointments, if possible"
                disabled={type === "schedule"}
              />
            </div>
          </>
        )}

        {type === "cancel" && (
          <CustomFormField
            fieldType={FormFieldType.TEXTAREA}
            control={form.control}
            name="cancellationReason"
            label="Reason for cancellation"
            placeholder="Enter reason for cancellation"
          />
        )}

        <SubmitButton
          isLoading={isLoading}
          className={`${
            type === "cancel" ? "shad-danger-btn" : "shad-primary-btn"
          } w-full`}
        >
          {buttonLabel}
        </SubmitButton>
      </form>
    </Form>
  );
};
export default AppointmentForm;
